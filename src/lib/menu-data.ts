import type { MenuItem } from './cart-context';
import type { Tables } from '@/integrations/supabase/types';
import biryani from '@/assets/biryani.jpg';
import gajarHalwa from '@/assets/gajar-halwa.jpg';
import gulabJamun from '@/assets/gulab-jamun.jpg';
import idliChutney from '@/assets/idli-chutney.jpg';
import masalaDosa from '@/assets/masala-dosa.jpg';
import meduVada from '@/assets/medu-vada.jpg';
import rasmalai from '@/assets/rasmalai.jpg';
import shahiPaneer from '@/assets/shahi-paneer.jpg';

export const menuImageMap = {
  'biryani.jpg': biryani,
  'gajar-halwa.jpg': gajarHalwa,
  'gulab-jamun.jpg': gulabJamun,
  'idli-chutney.jpg': idliChutney,
  'masala-dosa.jpg': masalaDosa,
  'medu-vada.jpg': meduVada,
  'rasmalai.jpg': rasmalai,
  'shahi-paneer.jpg': shahiPaneer,
} as const;

export const fallbackMenuItems: MenuItem[] = [
  {
    id: 'masala-dosa',
    name: 'Masala Dosa',
    description: 'Crispy golden crepe filled with spiced potato masala, served with coconut chutney and sambar.',
    price: 1200,
    image: masalaDosa,
    category: 'south-indian',
    serves: 'Serves 10-12',
    prepTime: '3 hours',
  },
  {
    id: 'idli-sambar',
    name: 'Idli & Chutney Platter',
    description: 'Steamed rice cakes with fresh coconut chutney and tomato chutney. A classic breakfast spread.',
    price: 800,
    image: idliChutney,
    category: 'south-indian',
    serves: 'Serves 10-12',
    prepTime: '2 hours',
  },
  {
    id: 'medu-vada',
    name: 'Medu Vada',
    description: 'Crispy lentil fritters served with sambar and coconut chutney on banana leaf.',
    price: 900,
    image: meduVada,
    category: 'south-indian',
    serves: 'Serves 10-12',
    prepTime: '2 hours',
  },
  {
    id: 'biryani',
    name: 'Hyderabadi Biryani',
    description: 'Aromatic basmati rice layered with tender meat, saffron, and caramelized onions in a copper handi.',
    price: 2500,
    image: biryani,
    category: 'mains',
    serves: 'Serves 10-12',
    prepTime: '4 hours',
  },
  {
    id: 'shahi-paneer',
    name: 'Shahi Paneer',
    description: 'Rich paneer cubes in a creamy cashew and tomato gravy, garnished with cream swirls.',
    price: 1800,
    image: shahiPaneer,
    category: 'mains',
    serves: 'Serves 10-12',
    prepTime: '3 hours',
  },
  {
    id: 'gajar-halwa',
    name: 'Gajar ka Halwa',
    description: 'Slow-cooked carrot pudding with khoya, garnished with silver leaf, pistachios and almonds.',
    price: 1500,
    image: gajarHalwa,
    category: 'north-indian-desserts',
    serves: 'Serves 10-12',
    prepTime: '4 hours',
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun',
    description: 'Golden milk-solid dumplings soaked in rose-cardamom sugar syrup, garnished with pistachios.',
    price: 1200,
    image: gulabJamun,
    category: 'north-indian-desserts',
    serves: 'Serves 10-12',
    prepTime: '3 hours',
  },
  {
    id: 'rasmalai',
    name: 'Rasmalai',
    description: 'Soft paneer patties in saffron-infused sweetened milk, topped with pistachios and saffron strands.',
    price: 1400,
    image: rasmalai,
    category: 'north-indian-desserts',
    serves: 'Serves 10-12',
    prepTime: '3 hours',
  },
];

type MenuItemRow = Tables<'menu_items'>;
const fallbackImage = biryani;

export const mapMenuItemRowToMenuItem = (item: MenuItemRow): MenuItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image_url || (item.image_path ? menuImageMap[item.image_path as keyof typeof menuImageMap] : undefined) || fallbackImage,
  category: item.category as MenuItem['category'],
  serves: item.serves,
  prepTime: item.prep_time,
});
