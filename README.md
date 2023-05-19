# skyscraper

Scrape posts from Bluesky, store them in a local database, and search them.

You must have `BLUESKY_USERNAME` and `BLUESKY_PASSWORD` environment variables defined (use an app-specific password).

## Getting started

Maybe this will be properly packaged some day but for now:

```sh
git clone https://github.com/micahflee/skyscraper.git
cd skyscraper
npm install
npm link
# now you can use the skyscraper command
```

It saves scraped data in a SQLite3 database called `skyscraper.sqlite`.

## Usage

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