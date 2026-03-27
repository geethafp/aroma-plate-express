CREATE TABLE public.menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL CHECK (price > 0),
  image_path text,
  image_url text,
  category text NOT NULL CHECK (category IN ('south-indian', 'mains', 'north-indian-desserts')),
  serves text NOT NULL,
  prep_time text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (image_path IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on menu_items"
ON public.menu_items
FOR SELECT
USING (is_active = true);

INSERT INTO public.menu_items (
  id,
  name,
  description,
  price,
  image_path,
  category,
  serves,
  prep_time,
  sort_order
) VALUES
  ('masala-dosa', 'Masala Dosa', 'Crispy golden crepe filled with spiced potato masala, served with coconut chutney and sambar.', 1200, 'masala-dosa.jpg', 'south-indian', 'Serves 10-12', '3 hours', 10),
  ('idli-sambar', 'Idli & Chutney Platter', 'Steamed rice cakes with fresh coconut chutney and tomato chutney. A classic breakfast spread.', 800, 'idli-chutney.jpg', 'south-indian', 'Serves 10-12', '2 hours', 20),
  ('medu-vada', 'Medu Vada', 'Crispy lentil fritters served with sambar and coconut chutney on banana leaf.', 900, 'medu-vada.jpg', 'south-indian', 'Serves 10-12', '2 hours', 30),
  ('biryani', 'Hyderabadi Biryani', 'Aromatic basmati rice layered with tender meat, saffron, and caramelized onions in a copper handi.', 2500, 'biryani.jpg', 'mains', 'Serves 10-12', '4 hours', 40),
  ('shahi-paneer', 'Shahi Paneer', 'Rich paneer cubes in a creamy cashew and tomato gravy, garnished with cream swirls.', 1800, 'shahi-paneer.jpg', 'mains', 'Serves 10-12', '3 hours', 50),
  ('gajar-halwa', 'Gajar ka Halwa', 'Slow-cooked carrot pudding with khoya, garnished with silver leaf, pistachios and almonds.', 1500, 'gajar-halwa.jpg', 'north-indian-desserts', 'Serves 10-12', '4 hours', 60),
  ('gulab-jamun', 'Gulab Jamun', 'Golden milk-solid dumplings soaked in rose-cardamom sugar syrup, garnished with pistachios.', 1200, 'gulab-jamun.jpg', 'north-indian-desserts', 'Serves 10-12', '3 hours', 70),
  ('rasmalai', 'Rasmalai', 'Soft paneer patties in saffron-infused sweetened milk, topped with pistachios and saffron strands.', 1400, 'rasmalai.jpg', 'north-indian-desserts', 'Serves 10-12', '3 hours', 80);
