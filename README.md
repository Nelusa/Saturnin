# Saturnin

## Veřejná ukázka

Výchozí spuštění Remixu používá veřejný demonstrační režim bez Deno/SurrealDB.

```sh
npm ci
npm run client:dev
```

Vlastní myšlenkové mapy se ukládají do localStorage tohoto prohlížeče. Tlačítko Uložit v editoru ukládá uzly i propojení; chybu úložiště aplikace hlásí a ponechá změny otevřené. Dokumenty jsou jen k prohlížení. Úkoly, nastavení a sdílení jsou prototypy a nelze je prezentovat jako připojený SaaS.

`SATURNIN_DEMO=false` zapne načítání projektů z `SATURNIN_API_URL` (výchozí `http://localhost:8080`). Tento přepínač nezprovozňuje autentizaci. Dokud nejsou implementované skutečné serverové sessions, chráněné čtení mimo demo přesměruje na přihlášení a chráněné zápisy zůstanou zakázané. Parametr `simulateAuth` neposkytuje oprávnění.

`npm run typecheck` kontroluje Remix klienta a konfiguraci Vite/Vitestu. Samostatný Deno server vyžaduje vlastní Deno kontrolu; ta není součástí této Node kontroly.

## Development

### Before run

Install application dependencies:

* [Deno](https://deno.com)
* [SurrealDB](https://surrealdb.com/install)

Install library dependencies:

```shellscript
deno install
```

### Initialize database

It will remove all data from previous database!

Run:

```shellscript
deno task db:dev
deno task db:init
deno task db:sample
```

### Development run

Run the dev servers:

```shellscript
deno task db:dev
deno task server:dev
deno task client:dev
```

## Project structure
```text
data   – SurrealDB database files. Is created within first SurrealDB start.
public – Static files for client (frontend).
client – Client (frontend) code – Remix.
server – Server (backend) code – Hono.
types  – Common TypeScript types for both server and client.
surql  – SurrealDB initialization scripts and sample data.
test   – Tests
http   – Testing HTTP requests for IntelliJ Idea HTTP client.
```

## Documentation

For detailed technical documentation, please see [DOCUMENTATION.md](DOCUMENTATION.md).

## Průchod veřejnou ukázkou

1. Úvod automaticky otevře přehled map. Karty zobrazují skutečné uzly a propojení.
2. Zvolte **Nová myšlenková mapa**, pojmenujte ji a vytvořte. Při chybě úložiště zůstane formulář otevřený.
3. V editoru přidejte další uzel, zapněte **Propojit** a spojte uzly pomocí jejich bodů. Vyberte uzel pro změnu názvu, barvy nebo tvaru.
4. **Uložit** v toolbaru uloží graf. Název, popis a tagy upravíte samostatně tlačítkem **Upravit** nad mapou.
5. Obnovte stránku a zkontrolujte obsah. Před opuštěním neuložené práce se zobrazí potvrzení.
6. Export JSON/PNG/SVG v editoru slouží k uchování mimo prohlížeč. JSON export není záloha celé aplikace a zatím nemá import.

Poškozené nebo neznámé uložené záznamy se při změně jiné mapy nemažou. Nečitelný formát úložiště blokuje zápis, místo aby se nahrazoval prázdným seznamem. Smazané ukázkové mapy se neobnovují. Uložení ze staršího otevřeného editoru nepřepíše mapu změněnou nebo smazanou v jiném okně. Veřejné sdílení v demu není implementováno; mapy jsou místní.
