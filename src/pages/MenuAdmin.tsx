import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, RefreshCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { fallbackMenuItems, loadStoredMenuItems, mapMenuItemRowToMenuItem, saveStoredMenuItems } from '@/lib/menu-data';
import type { MenuItem } from '@/lib/cart-context';

type MenuFormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  category: MenuItem['category'];
  serves: string;
  prepTime: string;
};

const categoryOptions: MenuItem['category'][] = ['south-indian', 'mains', 'north-indian-desserts'];

const createEmptyForm = (): MenuFormState => ({
  id: '',
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'south-indian',
  serves: 'Serves 10-12',
  prepTime: '3 hours',
});

const mapItemToForm = (item: MenuItem): MenuFormState => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: String(item.price),
  image: item.image,
  category: item.category,
  serves: item.serves,
  prepTime: item.prepTime,
});

const MenuAdmin = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormState>(createEmptyForm);

  const menuSeedQuery = useQuery({
    queryKey: ['menu-admin-seed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, description, price, image_path, image_url, category, serves, prep_time, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapMenuItemRowToMenuItem);
    },
    retry: false,
  });

  useEffect(() => {
    const storedMenu = loadStoredMenuItems();
    if (storedMenu !== null) {
      setMenuItems(storedMenu);
      return;
    }

    if (menuSeedQuery.data && menuSeedQuery.data.length > 0) {
      setMenuItems(menuSeedQuery.data);
      saveStoredMenuItems(menuSeedQuery.data);
      return;
    }

    setMenuItems(fallbackMenuItems);
    saveStoredMenuItems(fallbackMenuItems);
  }, [menuSeedQuery.data]);

  const handleChange = <K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const persistMenuItems = (items: MenuItem[], successMessage: string) => {
    setMenuItems(items);
    saveStoredMenuItems(items);
    toast.success(successMessage);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setForm(createEmptyForm());
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm(mapItemToForm(item));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.id.trim() || !form.name.trim() || !form.description.trim()) {
      toast.error('ID, name, and description are required');
      return;
    }

    if (!form.image.trim()) {
      toast.error('Image URL is required');
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Price must be a positive number');
      return;
    }

    if (!editingId && menuItems.some((item) => item.id === form.id.trim())) {
      toast.error('That item ID already exists');
      return;
    }

    const nextItem: MenuItem = {
      id: editingId ?? form.id.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      image: form.image.trim(),
      category: form.category,
      serves: form.serves.trim(),
      prepTime: form.prepTime.trim(),
    };

    if (editingId) {
      persistMenuItems(
        menuItems.map((item) => (item.id === editingId ? nextItem : item)),
        'Menu item updated on this browser'
      );
    } else {
      persistMenuItems([...menuItems, nextItem], 'Menu item added on this browser');
    }

    setEditingId(null);
    setForm(createEmptyForm());
  };

  const handleDelete = (id: string) => {
    persistMenuItems(
      menuItems.filter((item) => item.id !== id),
      'Menu item removed from this browser'
    );

    if (editingId === id) {
      setEditingId(null);
      setForm(createEmptyForm());
    }
  };

  const handleResetMenu = () => {
    setMenuItems(fallbackMenuItems);
    saveStoredMenuItems(fallbackMenuItems);
    setEditingId(null);
    setForm(createEmptyForm());
    toast.success('Menu reset to the original built-in list');
  };

  const itemCount = useMemo(() => menuItems.length, [menuItems]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreadcrumbTrail />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                <ShieldCheck size={14} />
                Menu Editor
              </div>
              <h1 className="font-serif-display text-4xl tracking-tight text-foreground">Manage Menu</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                This version works without login and saves menu edits in this browser only.
              </p>
            </div>
            <div className="rounded-2xl bg-background/80 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Items in current browser</p>
              <p className="font-mono-price text-2xl font-bold text-primary">{itemCount}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Current menu items</p>
                <p className="text-sm text-muted-foreground">
                  Changes here update the home page on this browser immediately.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetMenu} className="gap-2">
                  <RefreshCcw size={16} />
                  Reset Menu
                </Button>
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus size={16} />
                  New Item
                </Button>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
              If you want the changes to work for all customers online, we'll need a backend you control. Right now this editor is local to this browser because the original Supabase project is not accessible.
            </div>

            <div className="space-y-3">
              {menuItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>ID {item.id}</span>
                        <span>Price ₹{item.price.toLocaleString('en-IN')}</span>
                        <span>{item.serves}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(item.id)} className="gap-2">
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground">{editingId ? 'Edit menu item' : 'Add a new menu item'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use any image URL here. The home page will render that image from this browser's saved menu.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Item ID</label>
                <Input
                  value={editingId ?? form.id}
                  onChange={(event) => handleChange('id', event.target.value)}
                  placeholder="example: paneer-tikka"
                  disabled={!!editingId}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Name</label>
                <Input value={form.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Paneer Tikka" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  placeholder="Describe the dish, portions, and style."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Price</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(event) => handleChange('price', event.target.value)}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
                  <select
                    value={form.category}
                    onChange={(event) => handleChange('category', event.target.value as MenuItem['category'])}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Serves</label>
                  <Input value={form.serves} onChange={(event) => handleChange('serves', event.target.value)} placeholder="Serves 10-12" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Prep time</label>
                  <Input value={form.prepTime} onChange={(event) => handleChange('prepTime', event.target.value)} placeholder="3 hours" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Image URL</label>
                <Input
                  value={form.image}
                  onChange={(event) => handleChange('image', event.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" className="gap-2">
                  <Save size={16} />
                  {editingId ? 'Save Changes' : 'Add Item'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCreateNew}>
                  Reset Form
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default MenuAdmin;
