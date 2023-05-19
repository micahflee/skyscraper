# skyscraper

Scrape posts from Bluesky, store them in a local database, and search them.

You must have `BLUESKY_USERNAME` and `BLUESKY_PASSWORD` environment variables defined (use an app-specific password).

```
$ skyscraper --help
skyscraper <command>

Commands:
  skyscraper list-profiles          List profiles
  skyscraper fetch [username]       Fetch a profile
  skyscraper search [query]         Search
  skyscraper read-posts [username]  Read posts sequentially

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```