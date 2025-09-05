import os
import json
from decimal import Decimal
from glob import glob

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.conf import settings

from listings.models import PDFUpload, Listing


class Command(BaseCommand):
    help = "Import all JSON files from the project's data/ directory into listings"

    def add_arguments(self, parser):
        parser.add_argument(
            '--data-dir', dest='data_dir', default=None,
            help='Path to data directory (defaults to <BASE_DIR>/data)'
        )
        parser.add_argument(
            '--dry-run', action='store_true', dest='dry_run', default=False,
            help='Parse and report but do not write to the database'
        )

    def handle(self, *args, **options):
        base_dir = getattr(settings, 'BASE_DIR', os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        data_dir = options.get('data_dir') or os.path.join(base_dir, 'data')

        if not os.path.isdir(data_dir):
            self.stderr.write(self.style.ERROR(f"Data directory not found: {data_dir}"))
            return

        json_paths = sorted(glob(os.path.join(data_dir, '*.json')))
        if not json_paths:
            self.stdout.write(self.style.WARNING(f"No JSON files found in {data_dir}"))
            return

        total_files = 0
        total_imported = 0
        for path in json_paths:
            total_files += 1
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Failed to read {path}: {e}"))
                continue

            city = (data.get('city') or 'Unknown')
            auction_date = data.get('auction_date')
            if not auction_date:
                # Try parse from filename like YYYY-MM-DD in name
                auction_date = self._try_date_from_filename(os.path.basename(path))
            if not auction_date:
                self.stderr.write(self.style.WARNING(f"Skipping {os.path.basename(path)}: auction_date missing"))
                continue

            if options['dry_run']:
                count = len(data.get('listings') or [])
                self.stdout.write(self.style.NOTICE(f"[DRY RUN] {os.path.basename(path)} → {count} listings (city={city}, date={auction_date})"))
                continue

            imported = self._import_file(path, data, city, auction_date)
            total_imported += imported
            self.stdout.write(self.style.SUCCESS(f"Imported {imported} listings from {os.path.basename(path)}"))

        self.stdout.write(self.style.SUCCESS(f"Done. Files processed: {total_files}, Listings imported: {total_imported}"))

    def _try_date_from_filename(self, filename: str):
        import re
        m = re.search(r'(20\d{2}-\d{2}-\d{2})', filename)
        return m.group(1) if m else None

    def _parse_decimal(self, value, default=Decimal('0')):
        try:
            if value is None:
                return default
            if isinstance(value, (int, float, Decimal)):
                return Decimal(str(value))
            cleaned = ''.join(ch for ch in str(value) if ch.isdigit() or ch in ['.', ','])
            if cleaned.count(',') == 1 and cleaned.count('.') == 0:
                cleaned = cleaned.replace(',', '.')
            return Decimal(cleaned) if cleaned else default
        except Exception:
            return default

    def _import_file(self, path: str, data: dict, city: str, auction_date: str) -> int:
        # Create placeholder PDFUpload to relate listings to this import
        source_txt = os.path.basename(path)
        placeholder_bytes = b'JSON import placeholder file'
        placeholder_name = f"{os.path.splitext(source_txt)[0]}.pdf"

        pdf_upload = PDFUpload(
            filename=source_txt,
            city=str(city),
            auction_date=auction_date,
            processed=False,
            total_listings=0,
        )
        pdf_upload.file.save(placeholder_name, ContentFile(placeholder_bytes), save=True)

        listings = data.get('listings') or []
        created = 0
        existing_lots = set(pdf_upload.listings.values_list('lot_number', flat=True))
        next_lot_seq = 1
        for item in listings:
            try:
                title = item.get('title') or 'N/A'
                short_description = item.get('short_description') or ''
                full_description = item.get('full_description') or ''
                listing_type = (item.get('listing_type') or 'other').lower()
                brand = item.get('brand') or ''
                model = item.get('model') or ''
                year_val = item.get('year')
                try:
                    year = int(year_val) if year_val not in (None, '', 'N/A') else None
                except Exception:
                    year = None
                fuel_type = (item.get('fuel_type') or '').lower()

                starting_price = self._parse_decimal(
                    item.get('starting_price', item.get('estimated_value')),
                    Decimal('0')
                )
                guarantee_amount = self._parse_decimal(
                    item.get('guarantee_amount'),
                    starting_price * Decimal('0.10')
                )

                lot_number = str(item.get('lot_number') or '').strip()
                if not lot_number:
                    while True:
                        candidate = str(next_lot_seq).zfill(3)
                        next_lot_seq += 1
                        if candidate not in existing_lots:
                            lot_number = candidate
                            existing_lots.add(candidate)
                            break

                # Idempotency: avoid duplicate (pdf_upload, lot_number) pairs
                if Listing.objects.filter(pdf_upload=pdf_upload, lot_number=lot_number).exists():
                    continue

                Listing.objects.create(
                    lot_number=lot_number,
                    title=title,
                    listing_type=listing_type if listing_type in dict(Listing.LISTING_TYPES) else 'other',
                    short_description=short_description,
                    full_description=full_description,
                    brand=brand,
                    model=model,
                    year=year,
                    fuel_type=fuel_type if fuel_type in dict(Listing.FUEL_TYPES) else 'other',
                    quantity=str(item.get('quantity') or ''),
                    unit=str(item.get('unit') or ''),
                    starting_price=starting_price,
                    guarantee_amount=guarantee_amount,
                    pdf_upload=pdf_upload,
                    image_url=str(item.get('image_url') or ''),
                    original_pdf_url=str(item.get('original_pdf_url') or ''),
                )
                created += 1
            except Exception:
                continue

        pdf_upload.processed = True if created > 0 else pdf_upload.processed
        pdf_upload.total_listings = (pdf_upload.total_listings or 0) + created
        pdf_upload.save(update_fields=['processed', 'total_listings'])
        return created


