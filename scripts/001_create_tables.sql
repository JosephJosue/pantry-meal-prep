-- Create grocery_items table to store all grocery inventory
create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric not null default 0,
  unit text not null, -- e.g., 'kg', 'lbs', 'pieces', 'liters'
  category text, -- e.g., 'vegetables', 'fruits', 'dairy', 'meat'
  purchase_date timestamptz default now(),
  expiry_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create recipes table to store AI-generated or user-saved recipes
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  instructions text not null,
  prep_time integer, -- in minutes
  cook_time integer, -- in minutes
  servings integer default 1,
  created_at timestamptz default now()
);

-- Create recipe_ingredients table to store ingredients for each recipe
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_name text not null,
  quantity numeric not null,
  unit text not null,
  created_at timestamptz default now()
);

-- Create meal_plans table to track when users plan to make recipes
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  planned_date timestamptz not null,
  status text default 'planned', -- 'planned', 'completed', 'cancelled'
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.grocery_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plans enable row level security;

-- RLS Policies for grocery_items
create policy "Users can view their own grocery items"
  on public.grocery_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own grocery items"
  on public.grocery_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own grocery items"
  on public.grocery_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own grocery items"
  on public.grocery_items for delete
  using (auth.uid() = user_id);

-- RLS Policies for recipes
create policy "Users can view their own recipes"
  on public.recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recipes"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
  on public.recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete
  using (auth.uid() = user_id);

-- RLS Policies for recipe_ingredients
create policy "Users can view recipe ingredients for their recipes"
  on public.recipe_ingredients for select
  using (exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
    and recipes.user_id = auth.uid()
  ));

create policy "Users can insert recipe ingredients for their recipes"
  on public.recipe_ingredients for insert
  with check (exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
    and recipes.user_id = auth.uid()
  ));

create policy "Users can update recipe ingredients for their recipes"
  on public.recipe_ingredients for update
  using (exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
    and recipes.user_id = auth.uid()
  ));

create policy "Users can delete recipe ingredients for their recipes"
  on public.recipe_ingredients for delete
  using (exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
    and recipes.user_id = auth.uid()
  ));

-- RLS Policies for meal_plans
create policy "Users can view their own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists idx_grocery_items_user_id on public.grocery_items(user_id);
create index if not exists idx_recipes_user_id on public.recipes(user_id);
create index if not exists idx_recipe_ingredients_recipe_id on public.recipe_ingredients(recipe_id);
create index if not exists idx_meal_plans_user_id on public.meal_plans(user_id);
create index if not exists idx_meal_plans_planned_date on public.meal_plans(planned_date);
