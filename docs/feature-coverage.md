# Daily Tools → ToolsDice coverage

The machine-readable source matrix is
[sourceToolCoverage](../frontend/src/lib/tool-coverage.ts). It lists all 90
source entries and maps each retained capability to an active route and mode.
The catalog currently exposes 52 routes across eight categories, with 59
source capabilities mapped to those routes. The Data category is temporarily
disabled. The coverage test checks every source ID, route, exclusion, and the
frontend/backend runtime-config match.

## Summary

| Source category | Source entries | Retained | Destination |
| --- | ---: | ---: | --- |
| PDF | 12 | 12 | 10 routes; page reorder, rotation, and deletion share Manage PDF Pages |
| Text | 16 | 8 | Word and character counts share one tool |
| Images | 12 | 12 | 12 image routes |
| Developer | 14 | 11 | JSON format/validation, JWT, Regex, and format/minify modes share Code Formatter |
| Converters | 13 | 5 | Base64, color, number base, and unit conversion; Thai year moved here |
| Data | 8 | 0 | Temporarily disabled pending a future implementation |
| Generators | 7 | 7 | Hash, password, random string, QR, Lorem, and random-number routes |
| Date & Time | 3 | 2 | Date difference remains; Thai year moved to Converters |
| Share | 3 | 0 | Checklist paused with Data; remote sharing tools are not included |
| Calculators | 2 | 2 | Split Bill and BMI/TDEE |
| **Total** | **90** | **59** | **52 active routes, including new local tools outside the source matrix** |

## Omitted source entries

| Source ID | Reason |
| --- | --- |
| youtube-converter | Requires an external API. |
| short-link | Requires a link service and remote storage. |
| burn-note | Requires sending and storing note content on a server. |
| text-case | Removed from the focused Text catalog. |
| sort-lines | Removed from the focused Text catalog. |
| trim-spaces | Removed from the focused Text catalog. |
| markdown-preview | Removed from the focused Text catalog. |
| text-to-slug | Removed from the focused Text catalog. |
| remove-empty-lines | Removed from the focused Text catalog. |
| text-statistics | Detailed statistics were removed; the counter focuses on words and characters. |
| text-cleaner | Removed from the focused Text catalog. |
| json-viewer | Removed from the focused Developer list. |
| cron-helper | Removed from the focused Developer list. |
| url-parser | Removed from the focused Developer list. |
| json-to-yaml | Not in the requested Converters list. |
| yaml-to-json | Not in the requested Converters list. |
| csv-to-json | CSV/data tools are paused with the Data category. |
| json-to-csv | CSV/data tools are paused with the Data category. |
| url-encode | Not in the requested Converters list. |
| url-decode | Not in the requested Converters list. |
| timestamp-converter | Not in the requested Converters list. |
| csv-viewer | Data category is temporarily disabled. |
| csv-to-table | Data category is temporarily disabled. |
| remove-duplicate-rows | Data category is temporarily disabled. |
| sort-table | Data category is temporarily disabled. |
| filter-table | Data category is temporarily disabled. |
| column-extractor | Data category is temporarily disabled. |
| table-to-json | Data category is temporarily disabled. |
| table-to-csv | Data category is temporarily disabled. |
| pomodoro | Not in the requested Date & Time list. |
| shared-checklist | Paused along with the Data category. |

The active Developer tools appear in this order: API Request Builder, JWT
Decoder, Regex Tester, and Code Formatter. The API client sends data directly
to the endpoint the user enters, only after they choose Send. Other text,
files, and calculator inputs remain in browser memory. Code Formatter groups
JSON, JavaScript, HTML, CSS, and SQL formatting; supported minification modes
use the same workspace. PDF tasks remain separate routes except page
reordering, rotation, and deletion, which share Manage PDF Pages.

The new Currency Converter uses a rate entered by the user and does not fetch a
live market quote. Additional local tools include a random picker, loan
payment estimate, compound savings estimate, and trip fuel-cost estimate.
