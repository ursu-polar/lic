# Quiz licență (Next.js)

Aplicație pentru exersat grile din `data/intrebari.json`. Datele de progres (**statistici per întrebare** și **lista „Doar greșite”**) sunt salvate în **localStorage** în browser.

## Cerințe

- Node.js 20+

## Dezvoltare locală

```bash
npm install
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy pe Vercel

1. Împinge repo-ul pe GitHub/GitLab/Bitbucket.
2. În [Vercel](https://vercel.com): **Add New Project** → importă repo-ul.
3. **Root Directory**: lasă rădăcina proiectului (folderul cu `package.json`).
4. **Build Command**: `npm run build` (implicit).
5. **Output**: implicit pentru Next.js (`.next`).

Nu sunt necesare variabile de mediu.

## Actualizare întrebări

Înlocuiește `data/intrebari.json` (și opțional copia din rădăcină `intrebari.json`) cu noul fișier, apoi redeploy.

## Funcționalități

- **Random**: toate întrebările, ordine aleatorie.
- **Generează test 50**: 50 întrebări aleatoare fără repetare.
- **Capitole**: quiz pe capitolul selectat.
- **Doar greșite**: doar întrebări din lista de greșeli; răspuns corect le scoate din listă; orice greșeală în alte moduri le adaugă.
- **Verifică** → afișare corect/greșit → **Întrebarea următoare** / **Finalizează** → raport sesiune.
- **Statistici globale**: tabel cu număr răspunsuri / corect / greșit / rată, sortabil.
