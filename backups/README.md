# Lingvar Database Backups

This directory contains database backups for the Lingvar application.

## Backup Information

- **Database**: lingvar (PostgreSQL)
- **Tables included**:
  - users (user accounts and authentication)
  - nouns (Polish noun declensions with singular/plural forms)
  - pronouns (Polish pronoun declensions)
  - verbs (Polish verb conjugations)

## Backup Details

### lingvar_backup_20250913_131955_verified_declensions.sql ⭐ **LATEST**
- **Date**: September 13, 2025 13:19:55
- **Size**: 89KB
- **Content**: Complete database dump with fully verified and corrected declensions
- **Tables**: users, nouns (161 entries), pronouns, verbs (68 entries)
- **Key Features**:
  - ✅ All nouns from words_to_consider.txt file synchronized
  - ✅ Fixed 18 discrepancies in cases_pojed (singular forms)
  - ✅ Fixed 15 discrepancies in cases_mnoga (plural forms)
  - ✅ Perfect data match between file and database verified
  - ✅ Complete and validated declension data for all nouns

### lingvar_backup_20250913_122442_complete_nouns.sql
- **Date**: September 13, 2025 12:24:42
- **Size**: 87KB
- **Lines**: 620
- **Content**: Complete database dump with fully updated noun data
- **Tables**: users, nouns (161 entries), pronouns, verbs (68 entries)
- **Key Features**:
  - ✅ All nouns from words_to_consider.txt file synchronized
  - ✅ Fixed discrepancies in cases_pojed data (laptop, kot, sport, sportowiec, naukowiec)
  - ✅ Complete plural and singular declensions for all nouns
  - ✅ Verified data integrity between file and database

### lingvar_backup_20250913_093304.sql
- **Date**: September 13, 2025 09:33:04
- **Size**: 64KB
- **Lines**: 613
- **Content**: Complete database dump including schema and data
- **Tables**: users, nouns (154 entries), pronouns, verbs (68 entries)

## Restore Instructions

To restore from a backup:

```bash
# Method 1: Using psql
PGPASSWORD=lingvar_password psql -h postgres -p 5432 -U lingvar_user -d lingvar < lingvar_backup_YYYYMMDD_HHMMSS.sql

# Method 2: Using docker-compose (if database is containerized)
docker-compose exec -T postgres psql -U lingvar_user -d lingvar < lingvar_backup_YYYYMMDD_HHMMSS.sql
```

## Notes

- Backups are created using `pg_dump` with complete schema and data
- Backups include all user data, vocabulary entries, and application settings
- Regular backups should be created before major database changes
- Test restore procedures periodically to ensure backup integrity
