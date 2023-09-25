# README

## About

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

## Database Migrations

Create a new migration file in `db/migrations`

```
dbmate new create_accounts_table
```

## Integration Test

- Connect your card
  - initialize
    - input your pin (input)
    - name the card (input)
    - submit
    - success, card is initialized (toast)
    - keep your secret phrase safe (dialog)
    - I have written it down (button)
    - welcome page
  - pair
