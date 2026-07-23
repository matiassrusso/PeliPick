// Citas de cine rotativas. Se eligen dos distintas una sola vez por carga de
// página (el módulo se inicializa en cada refresh real), así el panel de
// login y el footer nunca muestran la misma y las dos cambian al refrescar.
export type Quote = { text: string; author: string };

export const QUOTES: Quote[] = [
  { text: "Cinema is a matter of what's in the frame and what's out.", author: "Martin Scorsese" },
  { text: "Film is truth twenty-four times a second.", author: "Jean-Luc Godard" },
  { text: "Cinema is the most beautiful fraud in the world.", author: "Jean-Luc Godard" },
  { text: "Drama is life with the dull bits cut out.", author: "Alfred Hitchcock" },
  { text: "If it can be written, or thought, it can be filmed.", author: "Stanley Kubrick" },
  { text: "Cinema is a mirror by which we often see ourselves.", author: "Alejandro G. Iñárritu" },
  { text: "To make a film is easy; to make a good film is war.", author: "Emir Kusturica" },
  { text: "Every great film should seem new every time you see it.", author: "Roger Ebert" },
  { text: "The cinema is not a slice of life, but a piece of cake.", author: "Alfred Hitchcock" },
  { text: "A film is a ribbon of dreams.", author: "Orson Welles" },
  { text: "Movies are a kind of therapy for me.", author: "Tim Burton" },
  { text: "Cinema is universal, beyond flags and borders and passports.", author: "Alejandro G. Iñárritu" },

  // Líneas de personajes (pelis y series), atribuidas al título.
  { text: "I'm gonna make him an offer he can't refuse.", author: "The Godfather" },
  { text: "Here's looking at you, kid.", author: "Casablanca" },
  { text: "You talkin' to me?", author: "Taxi Driver" },
  { text: "May the Force be with you.", author: "Star Wars" },
  { text: "I'll be back.", author: "The Terminator" },
  { text: "Why so serious?", author: "The Dark Knight" },
  { text: "You can't handle the truth!", author: "A Few Good Men" },
  { text: "There's no place like home.", author: "The Wizard of Oz" },
  { text: "To infinity and beyond!", author: "Toy Story" },
  { text: "I see dead people.", author: "The Sixth Sense" },
  { text: "Just keep swimming.", author: "Finding Nemo" },
  { text: "Winter is coming.", author: "Game of Thrones" },
  { text: "I am the one who knocks.", author: "Breaking Bad" },
  { text: "The truth is out there.", author: "The X-Files" },
];

function pickTwo(list: Quote[]): [Quote, Quote] {
  const a = Math.floor(Math.random() * list.length);
  let b = Math.floor(Math.random() * (list.length - 1));
  if (b >= a) b += 1; // corrimiento para garantizar b !== a
  return [list[a], list[b]];
}

const [primary, secondary] = pickTwo(QUOTES);

// PRIMARY = panel de login (centro), SECONDARY = footer (abajo). Distintas por
// construcción; si algún día quedan solo 0/1 citas, pickTwo rompería — hoy hay 26.
export const PRIMARY_QUOTE = primary;
export const SECONDARY_QUOTE = secondary;
