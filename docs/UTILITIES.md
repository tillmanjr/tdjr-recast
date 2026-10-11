# Utilities

Every utility the app ships with, by category. Each entry gives the dropdown name, the source file under `src/utilities/`, the input and result types (see the README for what those mean), whether it has a Quick row, and the rules it follows. Errors named here appear in red in the output area.

Sequences built in the Composer are not listed: they are yours, stored in the app's local storage, and run the utilities below in order.

## data

### CSV → JSON
`csv-to-json.js` · string → string

Parses RFC 4180 CSV. The first row is the header; every later row becomes an object whose keys are the header cells and whose values are all strings, nothing is coerced to numbers. Output is pretty-printed with two-space indentation.

- Quoted fields may contain commas, line breaks and doubled quotes (`""` is one quote).
- CRLF, LF and lone CR line endings are accepted; blank lines are skipped.
- A row shorter than the header is padded with empty strings. A longer row is an error: `Row 4 has 5 fields, header has 3`.
- Other errors: `Unterminated quoted field starting on line N`, `Unexpected text after closing quote on line N`, `No header row`.

### JSON → CSV
`json-to-csv.js` · string → string

Takes a JSON array of objects. The header is the union of all keys in first-seen order; missing values are blank; nested objects and arrays are written as JSON inside the cell. Cells containing a comma, a quote or a line break are quoted, with inner quotes doubled.

- A single object is written as one row. An array of arrays is written as plain rows with no header.
- `Invalid JSON: ...` for unparseable input; `Expected a JSON array of objects or arrays` for other shapes, including mixed arrays.
- Paste the JSON whole: this utility reads the text as one string, so the tab's Split lines box does not apply.

### JSON → TSV
`json-to-tsv.js` · string → string

Same as JSON → CSV with a tab as the delimiter. Only tabs, quotes and line breaks trigger quoting, so commas pass through unquoted.

### Swap pair
`swap-pair.js` · string → string · Quick, placeholder `12, 34`

Reverses the two sides of a separated pair, `<LHS><separator><RHS>` → `<RHS><separator><LHS>`.

- The separator is a run of tab, space and comma characters. The strongest kind present decides where to split, comma over tab over space, and the first run containing it is the split; everything after that run is the right-hand side. So `6 66   , 999` splits at the comma run and gives `999,6 66`, and `6 66<tab>999` gives `999<tab>6 66`.
- A single space or tab is kept as the output separator. A longer separator is trimmed at both ends: `12, 34`, `12 ,34` and `12 , 34` all give `34,12`. A run that is only whitespace collapses to one of its character.
- With only one kind of separator the first run is used, so `1 2 3` gives `2 3 1`.
- `Expected two pieces separated by tabs, spaces or commas` when either side would be empty.

### TSV → JSON
`tsv-to-json.js` · string → string

Same as CSV → JSON with a tab as the delimiter. Quoting rules are the same.

## date

### date → week of the year
`week-of-the-year.js` · string → string · Quick, placeholder `year, month, day`

Input is `year, month, day` with a four-digit year; month and day may be unpadded and spacing is loose. Returns the week number as a string.

- Rule: week 1 is the week containing January 1, and weeks start on Monday, so the number increments every Monday and runs to 52 or 53. This is not ISO 8601, where early January can belong to the previous year's last week.
- `Expected "year, month, day", e.g. "2026, 01, 31"` for the wrong shape; `Not a valid date: ...` for month 13, day 0, February 29 in a non-leap year and the like.

## hex

### hexdump → text
`hexdump-extract-text.js` · string → string

Recovers the text from a hex dump or a bare hex string.

- Accepts rows from `hexdump -C` (with the `|gutter|`), xxd (`0000:` offsets, 4-char word groups), 8-char word groups, dumps with no gutter, bare hex, and dot-interleaved gutter text such as `{.".m.s.g.s.".:.`.
- Detects UTF-16LE and UTF-16BE from zero-byte positions and byte order marks, otherwise reads UTF-8. An explicit `encoding` option exists in code (`utf16le`, `utf16be`, `utf8`) but has no UI yet.
- Non-printable code points are written inline as `<0x0A>`; a trailing odd byte in UTF-16 as `<trailing 0x41>`; lone surrogates as `<0xD83D>`.
- Errors: `Odd hex length (N)`, `Input is not a uniformly dot-interleaved string`, and `Dump contains a '*' repeat marker; regenerate it with hexdump -v`.
- Known limitation: a gutter-less dump whose offsets have no colon, such as `0000  41 42 43`, is all hex characters, so it is treated as bare hex and the offset is decoded as data. Dumps with an ASCII gutter, or xxd-style `0000:` offsets, decode correctly.

## text

### Remove line breaks
`remove-line-breaks.js` · string → string

Joins every line into one with nothing between them. CRLF, LF and lone CR all count, and a trailing line break goes too. Spaces and everything else are untouched.

### Strip single periods
`strip-single-periods.js` · string → string

Every run of periods becomes half as many, rounded down: `.` → nothing, `..` and `...` → `.`, `....` and `.....` → `..`. Runs are handled independently across the whole text.

### Trim end
`trim-end.js` · lines → lines

Removes trailing spaces and tabs from every line. Leading blanks stay; a line that was only blanks becomes empty.

### Trim ending comma
`trim-ending-comma.js` · lines → lines

Removes one comma from the end of each line that has one. If spaces or tabs follow the comma, the comma still goes and the blanks stay. Other commas are untouched, so `a,,` becomes `a,`.

## timestamp

All converters take a string of digits, optionally with a decimal fraction, and return ISO 8601 UTC, `YYYY-MM-DDTHH:MM:SS[.fraction]Z`, with as many fraction digits as the unit carries (none for seconds, three for milliseconds, seven for FILETIME, nine for nanoseconds; a fraction you type adds digits, up to nine). Values are handled as BigInt, so 19-digit inputs stay exact. Surrounding whitespace is ignored.

Shared errors: `Expected a string of digits, e.g. "1700000000"` and `<type>: <value> is out of range` when the calendar cannot represent the result. All of these live on `src/lib/timestamp.js`.

### timestamp → type
`timestamp-type.js` · string → string · Quick, placeholder `1700000000`, heads its group

Names the type a string of digits most likely is, by the number of digits in its integer part:

| Digits | Type |
|---|---|
| 7 | SQLite (Julian Day) |
| 1–6, 8–9 | CoreData (seconds since 2001) |
| 10 | Unix (seconds) |
| 12–13 | Unix (milliseconds) |
| 15–16 | Unix (microseconds) |
| 17 | Google Chrome / WebKit (µs since 1601) |
| 18 | Windows FILETIME (100ns since 1601) |
| 19 | Unix (nanoseconds) |

Counts that fit nothing, such as 11 or 14, give `No known timestamp type has N digits`. The bands overlap in theory: a 10-digit value is read as Unix seconds rather than CoreData from 2032 on, and a 7-digit value as a Julian Day rather than CoreData's first months of 2001.

### Chrome/WebKit → date
`webkit-timestamp-to-date.js` · string → string · Quick, placeholder `13300000000000000`

Microseconds since 1601-01-01 UTC, as used by Chrome's history and cookies. Six fraction digits.

### CoreData → date
`coredata-timestamp-to-date.js` · string → string · Quick, placeholder `700000000`

Seconds since 2001-01-01 UTC (Apple's Core Data and NSDate reference date). No fraction digits unless you type some.

### SQLite Julian → date
`sqlite-julian-to-date.js` · string → string · Quick, placeholder `2460000.5`

Julian Day number as SQLite's `julianday()` stores it; the fraction is the fraction of a day, so `2440587.5` is 1970-01-01T00:00:00Z. Dates before 1970 work. Output is to the second.

### unix ms → date, unix ns → date, unix seconds → date, unix µs → date
`unix-millis-to-date.js`, `unix-nanos-to-date.js`, `unix-seconds-to-date.js`, `unix-micros-to-date.js` · string → string · Quick, placeholders `1700000000123`, `1700000000123456789`, `1700000000`, `1700000000123456`

Milliseconds, nanoseconds, seconds or microseconds since 1970-01-01 UTC, with three, nine, zero or six fraction digits respectively.

### Windows FILETIME → date
`windows-filetime-to-date.js` · string → string · Quick, placeholder `132000000000000000`

100-nanosecond ticks since 1601-01-01 UTC, as in NTFS timestamps, the registry and Active Directory. Seven fraction digits; `116444736000000000` is the Unix epoch.

## web

### Base64 decode
`base64-decode.js` · string → string

Decodes standard or URL-safe base64 and reads the bytes as UTF-8. Whitespace and line wrapping are ignored and missing `=` padding is tolerated.

- `Not valid base64` for characters outside the alphabet or an impossible length.
- `Decoded bytes are not valid UTF-8 text` when the payload is binary rather than text.

### Base64 encode
`base64-encode.js` · string → string

Standard base64, with padding, of the UTF-8 bytes of the text, on one line. Accents and emoji round-trip.

### URL decode
`url-decode.js` · string → string · Quick, placeholder `a%20b%26c%3Dd`

`decodeURIComponent`. `+` is left alone, since it only means a space in form encoding and turning it into one would corrupt real pluses. `Not a valid URL-encoded string` for a malformed escape.

### URL encode
`url-encode.js` · string → string · Quick, placeholder `a b&c=d`

`encodeURIComponent`: everything but `A-Z a-z 0-9 - _ . ! ~ * ' ( )` is percent-encoded, multi-byte characters as UTF-8 escapes and line breaks as `%0A`.
