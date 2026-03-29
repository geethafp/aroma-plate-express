import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type MenuItemRow = Tables<'menu_items'>;
type MenuItemInsert = TablesInsert<'menu_items'>;
type MenuItemUpdate = TablesUpdate<'menu_items'>;

type MenuFormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  image_path: string;
  image_url: string;
  category: MenuItemRow['category'];
  serves: string;
  prep_time: string;
  sort_order: string;
  is_active: boolean;
};

const categoryOptions: MenuItemRow['category'][] = ['south-indian', 'mains', 'north-indian-desserts'];
const bundledImageOptions = [
  'masala-dosa.jpg',
  'idli-chutney.jpg',
  'medu-vada.jpg',
  'biryani.jpg',
  'shahi-paneer.jpg',
  'gajar-halwa.jpg',
  'gulab-jamun.jpg',
  'rasmalai.jpg',
];

const createEmptyForm = (): MenuFormState => ({
  id: '',
  name: '',
  description: '',
  price: '',
  image_path: bundledImageOptions[0],
  image_url: '',
  category: 'south-indian',
  serves: 'Serves 10-12',
  prep_time: '3 hours',
  sort_order: '0',
  is_active: true,
});

const mapRowToForm = (item: MenuItemRow): MenuFormState => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: String(item.price),
  image_path: item.image_path ?? bundledImageOptions[0],
  image_url: item.image_url ?? '',
  category: item.category,
  serves: item.serves,
  prep_time: item.prep_time,
  sort_order: String(item.sort_order),
  is_active: item.is_active,
});

const MenuAdmin = () => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormState>(createEmptyForm);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const menuItemsQuery = useQuery({
    queryKey: ['menu-admin-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    enabled: !!session,
  });

  const saveMutation = useMutation({
    mutationFn: async (nextForm: MenuFormState) => {
      const payload: MenuItemInsert | MenuItemUpdate = {
        id: nextForm.id.trim(),
        name: nextForm.name.trim(),
        description: nextForm.description.trim(),
        price: Number(nextForm.price),
        image_path: nextForm.image_url.trim() ? null : nextForm.image_path.trim(),
        image_url: nextForm.image_url.trim() || null,
        category: nextForm.category,
        serves: nextForm.serves.trim(),
        prep_time: nextForm.prep_time.trim(),
        sort_order: Number(nextForm.sort_order),
        is_active: nextForm.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editingId);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('menu_items').insert(payload as MenuItemInsert);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(editingId ? 'Menu item updated' : 'Menu item added');
      setEditingId(null);
      setForm(createEmptyForm());
      await queryClient.invalidateQueries({ queryKey: ['menu-admin-items'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to save menu item');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('menu_items').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.isActive ? 'Item enabled' : 'Item hidden');
      await queryClient.invalidateQueries({ queryKey: ['menu-admin-items'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to update item status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Menu item deleted');
      if (editingId) {
        setEditingId(null);
        setForm(createEmptyForm());
      }
      await queryClient.invalidateQueries({ queryKey: ['menu-admin-items'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to delete item');
    },
  });

  const activeCount = useMemo(
    () => (menuItemsQuery.data ?? []).filter((item) => item.is_active).length,
    [menuItemsQuery.data]
  );

  const handleChange = <K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleEdit = (item: MenuItemRow) => {
    setEditingId(item.id);
    setForm(mapRowToForm(item));
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setForm(createEmptyForm());
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.id.trim() || !form.name.trim() || !form.description.trim()) {
      toast.error('ID, name, and description are required');
      return;
    }

    if (!form.image_url.trim() && !form.image_path.trim()) {
      toast.error('Choose a bundled image or provide an image URL');
      return;
    }

    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
      toast.error('Price must be a positive number');
      return;
    }

    if (!Number.isFinite(Number(form.sort_order))) {
      toast.error('Sort order must be a number');
      return;
    }

    saveMutation.mutate(form);
  };

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
                Menu Admin
              </div>
              <h1 className="font-serif-display text-4xl tracking-tight text-foreground">Manage Menu</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Add dishes, update prices, choose images, and control which items appear on the storefront.
              </p>
            </div>
            <div className="rounded-2xl bg-background/80 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Visible dishes</p>
              <p className="font-mono-price text-2xl font-bold text-primary">{activeCount}</p>
            </div>
          </div>
        </div>

        {!session ? (
          <section className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <h2 className="font-serif-display text-3xl text-foreground">Sign in required</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              This page edits live menu data in Supabase. Please sign in first, then return here to add items or update prices.
            </p>
            <div className="mt-6">
              <Button asChild>
                <a href="/login">Go to Login</a>
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Current menu items</p>
                  <p className="text-sm text-muted-foreground">
                    {menuItemsQuery.data?.length ?? 0} total item{(menuItemsQuery.data?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => menuItemsQuery.refetch()} disabled={menuItemsQuery.isFetching} className="gap-2">
                    <RefreshCcw size={16} className={menuItemsQuery.isFetching ? 'animate-spin' : ''} />
                    Refresh
                  </Button>
                  <Button onClick={handleCreateNew} className="gap-2">
                    <Plus size={16} />
                    New Item
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {(menuItemsQuery.data ?? []).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                            {item.is_active ? 'Visible' : 'Hidden'}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>ID {item.id}</span>
                          <span>Price ₹{item.price.toLocaleString('en-IN')}</span>
                          <span>Sort {item.sort_order}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => toggleActiveMutation.mutate({ id: item.id, isActive: !item.is_active })}
                          disabled={toggleActiveMutation.isPending}
                        >
                          {item.is_active ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                          className="gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}

                {!menuItemsQuery.isFetching && (menuItemsQuery.data?.length ?? 0) === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-sm text-muted-foreground">
                    No menu items found yet. Use the form to add your first dish.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground">{editingId ? 'Edit menu item' : 'Add a new menu item'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingId ? 'Update the details below and save your changes.' : 'Create a new dish and publish it to the home page.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Item ID</label>
                  <Input
                    value={form.id}
                    onChange={(event) => handleChange('id', event.target.value)}
                    placeholder="example: paneer-tikka"
                    disabled={!!editingId}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {editingId ? 'Item ID is locked for existing rows.' : 'Use a unique slug-style ID.'}
                  </p>
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
                    <label className="mb-2 block text-sm font-medium text-foreground">Sort order</label>
                    <Input
                      type="number"
                      value={form.sort_order}
                      onChange={(event) => handleChange('sort_order', event.target.value)}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
                    <select
                      value={form.category}
                      onChange={(event) => handleChange('category', event.target.value as MenuItemRow['category'])}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Visible on site</label>
                    <select
                      value={String(form.is_active)}
                      onChange={(event) => handleChange('is_active', event.target.value === 'true')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
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
                    <Input value={form.prep_time} onChange={(event) => handleChange('prep_time', event.target.value)} placeholder="3 hours" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Bundled image</label>
                  <select
                    value={form.image_path}
                    onChange={(event) => handleChange('image_path', event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    disabled={!!form.image_url.trim()}
                  >
                    {bundledImageOptions.map((image) => (
                      <option key={image} value={image}>
                        {image}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This uses one of the images already shipped with the app.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Custom image URL</label>
                  <Input
                    value={form.image_url}
                    onChange={(event) => handleChange('image_url', event.target.value)}
                    placeholder="https://..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    If you fill this in, it overrides the bundled image selection.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                    <Save size={16} />
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCreateNew}>
                    Reset Form
                  </Button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default MenuAdmin;
