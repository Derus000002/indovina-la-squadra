# Indovina la Squadra

Il quiz da tavolo per veri tifosi: un telefono (o un PC), gli amici e una sola regola — indovina il club in cui gioca il calciatore.

## Gioca online

Il sito è pubblicato su GitHub Pages: **https://derus000002.github.io/indovina-la-squadra/**

Apri il link da telefono o PC: non serve installare nulla.

## Come si gioca

1. Apri `index.html` nel browser. Non serve installare niente: funziona anche con doppio clic, da telefono o da computer.
2. Scegli quanti giocatori ci sono (da 2 a 8), i loro nomi, quante domande a testa e la difficoltà.
3. A ogni turno il telefono passa al giocatore successivo: leggi il nome del calciatore e scegli la sua squadra tra quattro opzioni.
4. Ogni risposta esatta vale **100 punti**, più un bonus velocità fino a **50 punti** e un bonus serie fino a **60 punti**. Risposta sbagliata o tempo scaduto: zero punti.
5. Alla fine vince chi ha più punti. In caso di parità contano le risposte esatte, poi la serie migliore e infine il tempo totale.

La partita dura all'incirca 3–15 minuti a seconda del numero di giocatori e delle domande scelte.

## Controlli

- **1–4** per rispondere da tastiera.
- **Invio** o **Spazio** per passare alla domanda successiva.
- Pulsante audio in alto per attivare/disattivare i suoni.
- Pulsante **Regole** per rileggere le istruzioni durante la partita (il timer si mette in pausa).
- Su telefono, il sito è pensato per il passaggio di mano: ogni turno inizia con una schermata "pass" e finisce con il riepilogo.

## Dati

I dati sono inclusi nel file `game-data.js`, quindi il gioco funziona anche offline (le uniche risorse esterne sono i font di Google Fonts).

- **281 calciatori** attivi.
- **99 club** in **16 paesi**: 82 hanno almeno un calciatore nel tabellone, gli altri servono come alternative plausibili.
- La stagione di riferimento è la **2026/27**, aggiornata a **novembre 2026**.
- Le rose cambiano: i trasferimenti possono rendere una risposta "vecchia" dopo qualche settimana. La fonte dei club è Wikipedia (infobox dei calciatori); il link alla voce è conservato nel campo `src` di ogni giocatore in `game-data.js`.

## Rigenerare il tabellone

Richiede Node.js 20+ e una connessione internet.

```bash
node tools/fetch-players.mjs   # scarica i dati da Wikipedia in tools/raw-players.json
node tools/build-data.mjs      # genera game-data.js
```

`tools/fetch-players.mjs` usa la lista curata dei calciatori e salva i dati grezzi; `tools/build-data.mjs` normalizza nomi, club, nazionalità e età. La lista dei club e dei colori si trova in `tools/clubs.mjs`.

## Tecnologia

HTML, CSS e JavaScript puri. Nessun framework, nessun build step, nessuna chiamata a un server: apri `index.html` e gioca. Suoni sintetizzati con Web Audio, coriandoli su canvas e layout responsive con `prefers-reduced-motion` rispettato.

## File

- `index.html` — struttura delle schermate.
- `styles.css` — sistema visivo completo (sticker, ticket, responsive, animazioni).
- `app.js` — flusso di gioco, domande, timer, punteggi, audio, classifica.
- `game-data.js` — calciatori e club generati.
- `favicon.svg` — icona del sito.
- `tools/` — pipeline di ricerca e generazione dei dati.
