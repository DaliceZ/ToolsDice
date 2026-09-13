# Daily Tools → ToolsDice coverage

The machine-readable matrix is [`sourceToolCoverage`](../frontend/src/lib/tool-coverage.ts).
It contains one row per source catalog entry and names the destination route and
mode for every retained feature. The coverage test checks that all 90 source
IDs are unique, each retained route exists, the exclusions are explicit, the
61 target routes are unique, and frontend fallback config matches the backend
allowlist. Run `bun run test` to verify it.

## Summary

| Source category | Source entries | Retained | Destination |
| --- | ---: | ---: | --- |
| PDF | 12 | 12 | PDF Workspace |
| ข้อความ | 16 | 16 | 16 focused text-tool routes |
| รูปภาพ | 12 | 12 | 12 image routes |
| นักพัฒนา | 14 | 14 | JSON Toolkit, URL Toolkit, JWT, Regex, Cron, and code format/minify routes |
| ตัวแปลง | 13 | 12 | JSON/YAML, CSV/JSON, Base64, URL, timestamp, color, number-base, and unit modes |
| ข้อมูล | 8 | 8 | CSV Workspace and Checklist |
| ตัวสร้าง | 7 | 7 | Hash & UUID, password, random string, QR, Lorem, and random-number routes |
| วันและเวลา | 3 | 3 | Date Calculator, Thai Year, and Pomodoro |
| แชร์ | 3 | 1 | Shared Checklist moves to ข้อมูล; remote sharing features are excluded |
| คำนวณ | 2 | 2 | Split Bill and BMI/TDEE |
| **Total** | **90** | **87** | **61 routes, including the existing Timezone Converter** |

## Excluded source entries

| Source ID | Reason |
| --- | --- |
| `youtube-converter` | Requires an external API. |
| `short-link` | Requires a link-generation service and remote storage. |
| `burn-note` | Requires sending and storing note content on a server. |

The shared Checklist is retained as `checklist` and intentionally stores entries
in page memory only. JSON import and export are initiated by the user. Existing
ToolsDice route slugs remain stable; related source entries share one route
when they are modes of the same tool.
