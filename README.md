# APlace

APlace este o aplicație web pentru gestionarea abrevierilor. Utilizatorii pot crea, edita, căuta, filtra și partaja abrevieri, având acces la statistici în timp real și posibilitatea de a exporta conținutul. Aplicația este construită pe o arhitectură modulară, cu un backend Node.js și o interfață web prietenoasă și responsivă.

## Funcționalități principale

- Autentificare cu roluri (utilizator, administrator)
- Gestionare completă a abrevierilor (CRUD)
- Căutare și filtrare avansată (după text, domeniu, limbă, autor)
- Statistici în timp real (vizualizări, top abrevieri)
- Export în format HTML și Markdown
- Generare RSS feed cu cele mai populare abrevieri
- Interfață responsivă compatibilă cu browsere moderne

## Roluri utilizatori

- **Vizitator (Guest)**: poate accesa doar lista publică de abrevieri și statistici.
- **Utilizator autentificat**: poate crea, modifica și șterge propriile abrevieri. Poate accesa exportul și statisticile.
- **Administrator**: are acces complet la toate abrevierile și utilizatorii, inclusiv funcții de moderare și administrare a platformei.

## Arhitectură și tehnologii folosite

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js cu Express
- **Bază de date**: SQLite (fișier local)
- **Librării și instrumente**:
  - Chart.js pentru grafice statistice
  - JWT pentru autentificare securizată
  - bcrypt pentru criptarea parolelor
  - Mermaid.js pentru generarea diagramelor
  - RSS Generator pentru feed-ul abrevierilor populare

## Performanță și constrângeri

- Timp de răspuns pentru operații:
  - căutare: < 1 secundă
  - operații CRUD: < 2 secunde
  - export: < 10 secunde
- Suport pentru minim 10 utilizatori simultan
- Maxim 100 de abrevieri per utilizator
- Uptime estimat: minim 99% în timpul orelor de utilizare

## Securitate

- Autentificare bazată pe token JWT
- Criptarea parolelor cu bcrypt
- Protecție împotriva SQL injection și XSS
- Validare inputuri și tratare erori
- Backup automat și logare activitate server
