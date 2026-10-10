import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import {
  Apple,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Scale,
  Search,
  Sparkles,
  Trash2,
  Utensils,
  Wheat,
} from 'lucide-react';

type Food = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: string;
  date: string;
};
type Pantry = {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expiry: string;
};
type Weight = { id: string; kg: number; date: string; note: string };
type Data = { foods: Food[]; pantry: Pantry[]; weights: Weight[] };
const today = () => new Date().toISOString().slice(0, 10);
const empty: Data = { foods: [], pantry: [], weights: [] };

function App() {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState<Data>(empty);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const [food, setFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    meal: 'Lunch',
  });
  const [item, setItem] = useState({
    name: '',
    quantity: '',
    category: 'Produce',
    expiry: '',
  });
  const [weight, setWeight] = useState({ kg: '', date: today(), note: '' });
  const [query, setQuery] = useState('');
  const [ideas, setIdeas] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [goal, setGoal] = useState('2000');
  const [weightGoal, setWeightGoal] = useState('65');

  async function refresh() {
    try {
      const r = await api.get('/api/tracker');
      setData(r.data as Data);
    } catch {
      setNotice('Could not load saved data. Please refresh in a moment.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function save(kind: string, record: Record<string, unknown>) {
    try {
      await api.post('/api/tracker/' + kind, record);
      await refresh();
      setNotice('Saved successfully');
      return true;
    } catch {
      setNotice('Save failed. Please try again.');
      return false;
    }
  }
  async function remove(kind: string, id: string) {
    try {
      await api.delete('/api/tracker/' + kind + '/' + id);
      await refresh();
      setNotice('Entry removed');
    } catch {
      setNotice('Could not remove this entry.');
    }
  }
  const dayFoods = data.foods.filter(f => f.date === today());
  const totals = dayFoods.reduce(
    (a, f) => ({
      calories: a.calories + f.calories,
      protein: a.protein + f.protein,
      carbs: a.carbs + f.carbs,
      fat: a.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const latestWeight = [...data.weights].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0];
  const filteredPantry = data.pantry.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );
  const nav = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Food diary', icon: ClipboardList },
    { name: 'My pantry', icon: Wheat },
    { name: 'Weight log', icon: Scale },
    { name: 'AI meal ideas', icon: Sparkles },
  ];
  async function getIdeas() {
    setAiBusy(true);
    setIdeas('');
    try {
      const r = await api.post('/api/ideas', {
        pantry: data.pantry.map(p => p.name + ' (' + p.quantity + ')'),
        foods: dayFoods.map(f => f.name),
        goal: 'balanced, practical meals',
        query,
      });
      setIdeas(
        r.data.ideas ||
          'Try combining a pantry protein, a vegetable and a whole-grain carbohydrate.'
      );
    } catch {
      setIdeas('Meal ideas are temporarily unavailable. Try again shortly.');
    } finally {
      setAiBusy(false);
    }
  }
  const caloriesPercent = Math.min(
    100,
    Math.round((totals.calories / Math.max(1, Number(goal))) * 100)
  );
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Apple size={21} />
          </div>
          <div>
            <strong>
              nourish<span>.</span>
            </strong>
            <small>YOUR DAILY WELLNESS</small>
          </div>
        </div>
        <div className="profile" aria-label="Owner profile">
          <div className="avatar">F</div>
          <div className="profile-details">
            <b>Faida Sylivester</b>
            <small className="profile-email">profitsylivester@gmail.com</small>
          </div>
          <span className="online" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {nav.map(n => (
            <button
              key={n.name}
              className={tab === n.name ? 'nav-item active' : 'nav-item'}
              onClick={() => setTab(n.name)}
            >
              <n.icon size={18} />
              <span>{n.name}</span>
              {n.name === 'AI meal ideas' && (
                <span className="new-pill">AI</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-icon">
            <Sparkles size={18} />
          </div>
          <b>Small steps count.</b>
          <p>Build a routine that works for you, one meal at a time.</p>
          <button onClick={() => setTab('AI meal ideas')}>
            Get meal inspiration <span>↗</span>
          </button>
        </div>
        <div className="sidebar-foot">
          Made for your everyday health <span>♥</span>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            Workspace <span>/</span> <b>{tab}</b>
          </div>
          <div className="top-actions">
            <span className="today-tag">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <div className="avatar small" aria-label="Faida Sylivester">F</div>
          </div>
        </header>
        <div className="content">
          <div className="welcome">
            <div>
              <div className="eyebrow">
                <span className="sparkle">✳</span> YOUR PERSONAL NUTRITION SPACE
              </div>
              <h1>
                {tab === 'Overview' ? 'A little better, every day.' : tab}
              </h1>
              <p>
                {tab === 'Overview'
                  ? 'Your meals, pantry and progress — all in one calm place.'
                  : 'Keep track of the little choices that support your wellbeing.'}
              </p>
            </div>
            <div className="date-card">
              <span> TODAY</span>
              <b>
                {new Date().toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                })}
              </b>
              <small>
                {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
              </small>
            </div>
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button onClick={() => setNotice('')}>×</button>
            </div>
          )}
          {busy ? (
            <div className="loading">Getting your tracker ready…</div>
          ) : null}
          {tab === 'Overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card calories">
                  <div className="stat-top">
                    <span>Calories today</span>
                    <div className="stat-icon">
                      <Apple size={17} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {Math.round(totals.calories).toLocaleString()}{' '}
                    <small>kcal</small>
                  </div>
                  <div className="progress">
                    <i style={{ width: caloriesPercent + '%' }} />
                  </div>
                  <div className="stat-foot">
                    <span>
                      {Math.max(
                        0,
                        Number(goal) - totals.calories
                      ).toLocaleString()}{' '}
                      kcal to daily target
                    </span>
                    <button
                      onClick={() => {
                        const v = prompt('Daily calorie target (kcal)', goal);
                        if (v && Number(v) > 0) setGoal(v);
                      }}
                    >
                      Edit target
                    </button>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Protein today</span>
                    <div className="stat-icon mint">
                      <Wheat size={17} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {Math.round(totals.protein)} <small>g</small>
                  </div>
                  <div className="mini-bars">
                    <i
                      style={{
                        height: Math.min(100, totals.protein * 2) + '%',
                      }}
                    />
                    <i
                      style={{ height: Math.min(100, totals.carbs / 2) + '%' }}
                    />
                    <i
                      style={{ height: Math.min(100, totals.fat * 2) + '%' }}
                    />
                    <i
                      style={{
                        height: Math.min(100, totals.protein * 1.5) + '%',
                      }}
                    />
                    <i
                      style={{
                        height: Math.min(100, totals.carbs / 1.5) + '%',
                      }}
                    />
                    <i
                      style={{ height: Math.min(100, totals.fat * 2.5) + '%' }}
                    />
                  </div>
                  <div className="stat-foot">
                    <span>
                      Carbs {Math.round(totals.carbs)}g · Fat{' '}
                      {Math.round(totals.fat)}g
                    </span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Pantry items</span>
                    <div className="stat-icon peach">
                      <Wheat size={17} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {data.pantry.length} <small>items tracked</small>
                  </div>
                  <div className="stat-foot">
                    <span>
                      {
                        data.pantry.filter(p => p.expiry && p.expiry <= today())
                          .length
                      }{' '}
                      past expiry date
                    </span>
                    <button onClick={() => setTab('My pantry')}>
                      View pantry ↗
                    </button>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Latest weight</span>
                    <div className="stat-icon lavender">
                      <Scale size={17} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {latestWeight ? latestWeight.kg : '—'} <small>kg</small>
                  </div>
                  <div className="stat-foot">
                    <span>
                      {latestWeight
                        ? 'Logged ' + latestWeight.date
                        : 'Add your first entry'}
                    </span>
                    <button onClick={() => setTab('Weight log')}>
                      View log ↗
                    </button>
                  </div>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="panel diary-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Today's food diary</h2>
                      <p>A simple look at what you've enjoyed.</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setTab('Food diary')}
                    >
                      Full diary ↗
                    </button>
                  </div>
                  {dayFoods.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Utensils size={22} />
                      </div>
                      <b>Your diary starts here</b>
                      <p>Add a meal to see your daily nutrition summary.</p>
                      <button
                        className="primary-btn"
                        onClick={() => setTab('Food diary')}
                      >
                        <Plus size={16} /> Log a meal
                      </button>
                    </div>
                  ) : (
                    <div className="entry-list">
                      {dayFoods.slice(0, 5).map(f => (
                        <div className="entry" key={f.id}>
                          <div className="meal-dot">
                            {f.meal === 'Breakfast'
                              ? '☀'
                              : f.meal === 'Dinner'
                                ? '☾'
                                : '◒'}
                          </div>
                          <div className="entry-info">
                            <b>{f.name}</b>
                            <small>
                              {f.meal} · {f.protein}g protein
                            </small>
                          </div>
                          <strong>
                            {f.calories} <small>kcal</small>
                          </strong>
                          <button
                            className="icon-btn"
                            aria-label="Delete meal"
                            onClick={() => void remove('foods', f.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section className="panel inspiration-panel">
                  <div className="inspire-orb">
                    <Sparkles size={22} />
                  </div>
                  <span className="section-kicker">A LITTLE INSPIRATION</span>
                  <h2>Good food, less guesswork.</h2>
                  <p>
                    Let AI turn the ingredients you already have into practical
                    meal ideas.
                  </p>
                  <div className="ingredient-preview">
                    {data.pantry.slice(0, 4).map(p => (
                      <span key={p.id}>{p.name}</span>
                    ))}
                    {data.pantry.length === 0 && (
                      <>
                        <span>Vegetables</span>
                        <span>Whole grains</span>
                        <span>Your favourites</span>
                      </>
                    )}
                  </div>
                  <button
                    className="primary-btn full"
                    onClick={() => setTab('AI meal ideas')}
                  >
                    Find meal ideas <span>↗</span>
                  </button>
                </section>
              </div>
              <section className="panel quick-panel">
                <div className="panel-head">
                  <div>
                    <h2>Quick actions</h2>
                    <p>Keep your tracker up to date.</p>
                  </div>
                </div>
                <div className="quick-actions">
                  <button onClick={() => setTab('Food diary')}>
                    <span className="quick-icon coral">
                      <Plus size={19} />
                    </span>
                    <span>
                      <b>Log a meal</b>
                      <small>Record food and nutrients</small>
                    </span>
                    <span className="arrow">↗</span>
                  </button>
                  <button onClick={() => setTab('My pantry')}>
                    <span className="quick-icon green">
                      <Wheat size={19} />
                    </span>
                    <span>
                      <b>Add pantry item</b>
                      <small>Track what you have</small>
                    </span>
                    <span className="arrow">↗</span>
                  </button>
                  <button onClick={() => setTab('Weight log')}>
                    <span className="quick-icon violet">
                      <Scale size={19} />
                    </span>
                    <span>
                      <b>Log weight</b>
                      <small>Follow your own trend</small>
                    </span>
                    <span className="arrow">↗</span>
                  </button>
                </div>
              </section>
            </>
          )}
          {tab === 'Food diary' && (
            <div className="page-grid">
              <section className="panel form-panel">
                <h2>Log a meal</h2>
                <p className="muted">
                  Enter nutrition values from a food label or your best
                  estimate.
                </p>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    if (
                      !food.name.trim() ||
                      food.calories === '' ||
                      Number(food.calories) < 0
                    ) {
                      setNotice('Add a food name and a valid calorie value.');
                      return;
                    }
                    const ok = await save('foods', {
                      ...food,
                      calories: Number(food.calories),
                      protein: Number(food.protein) || 0,
                      carbs: Number(food.carbs) || 0,
                      fat: Number(food.fat) || 0,
                      date: today(),
                    });
                    if (ok)
                      setFood({
                        name: '',
                        calories: '',
                        protein: '',
                        carbs: '',
                        fat: '',
                        meal: 'Lunch',
                      });
                  }}
                >
                  <label>
                    Food or meal name
                    <input
                      required
                      value={food.name}
                      onChange={e => setFood({ ...food, name: e.target.value })}
                      placeholder="e.g. Rice, beans and vegetables"
                    />
                  </label>
                  <label>
                    Meal type
                    <select
                      value={food.meal}
                      onChange={e => setFood({ ...food, meal: e.target.value })}
                    >
                      {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(x => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Calories (kcal)
                    <input
                      required
                      type="number"
                      min="0"
                      value={food.calories}
                      onChange={e =>
                        setFood({ ...food, calories: e.target.value })
                      }
                      placeholder="e.g. 450"
                    />
                  </label>
                  <div className="form-row">
                    {(['protein', 'carbs', 'fat'] as const).map(x => (
                      <label key={x}>
                        {x[0].toUpperCase() + x.slice(1)} (g)
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={food[x]}
                          onChange={e =>
                            setFood({ ...food, [x]: e.target.value })
                          }
                          placeholder="0"
                        />
                      </label>
                    ))}
                  </div>
                  <button className="primary-btn" type="submit">
                    <Plus size={16} /> Save meal
                  </button>
                </form>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Food history</h2>
                    <p>Meals recorded on this device account.</p>
                  </div>
                </div>
                {data.foods.length === 0 ? (
                  <div className="empty-state compact">No meals yet.</div>
                ) : (
                  <div className="entry-list">
                    {[...data.foods]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(f => (
                        <div className="entry" key={f.id}>
                          <div className="meal-dot">◒</div>
                          <div className="entry-info">
                            <b>{f.name}</b>
                            <small>
                              {f.date} · {f.meal}
                            </small>
                          </div>
                          <strong>
                            {f.calories} <small>kcal</small>
                          </strong>
                          <button
                            className="icon-btn"
                            aria-label="Delete meal"
                            onClick={() => void remove('foods', f.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          )}
          {tab === 'My pantry' && (
            <>
              <section className="panel form-panel">
                <h2>What's in your pantry?</h2>
                <p className="muted">
                  Track ingredients and use them to plan meals.
                </p>
                <form
                  className="pantry-form"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!item.name.trim()) return;
                    const ok = await save('pantry', item);
                    if (ok)
                      setItem({
                        name: '',
                        quantity: '',
                        category: 'Produce',
                        expiry: '',
                      });
                  }}
                >
                  <label>
                    Ingredient name
                    <input
                      required
                      value={item.name}
                      onChange={e => setItem({ ...item, name: e.target.value })}
                      placeholder="e.g. Beans"
                    />
                  </label>
                  <label>
                    Quantity
                    <input
                      value={item.quantity}
                      onChange={e =>
                        setItem({ ...item, quantity: e.target.value })
                      }
                      placeholder="e.g. 500 g"
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={item.category}
                      onChange={e =>
                        setItem({ ...item, category: e.target.value })
                      }
                    >
                      {[
                        'Produce',
                        'Grains & pasta',
                        'Protein',
                        'Dairy',
                        'Canned & dry goods',
                        'Spices',
                        'Other',
                      ].map(x => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Best before (optional)
                    <input
                      type="date"
                      value={item.expiry}
                      onChange={e =>
                        setItem({ ...item, expiry: e.target.value })
                      }
                    />
                  </label>
                  <button className="primary-btn" type="submit">
                    <Plus size={16} /> Add ingredient
                  </button>
                </form>
              </section>
              <section className="panel pantry-results">
                <div className="panel-head">
                  <div>
                    <h2>
                      Your ingredients{' '}
                      <span className="count">{data.pantry.length}</span>
                    </h2>
                    <p>Know what you have before you shop.</p>
                  </div>
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Find ingredient"
                    />
                  </div>
                </div>
                {filteredPantry.length === 0 ? (
                  <div className="empty-state compact">
                    No ingredients found. Add an item above.
                  </div>
                ) : (
                  <div className="pantry-grid">
                    {filteredPantry.map(p => (
                      <div className="pantry-item" key={p.id}>
                        <div className="pantry-symbol">
                          <Wheat size={20} />
                        </div>
                        <div className="entry-info">
                          <b>{p.name}</b>
                          <small>
                            {p.category} · {p.quantity || 'Quantity not set'}
                          </small>
                          {p.expiry && (
                            <small
                              className={p.expiry <= today() ? 'expired' : ''}
                            >
                              {p.expiry <= today()
                                ? 'Check expiry: '
                                : 'Best before: '}
                              {p.expiry}
                            </small>
                          )}
                        </div>
                        <button
                          className="icon-btn"
                          aria-label={'Delete ' + p.name}
                          onClick={() => void remove('pantry', p.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {tab === 'Weight log' && (
            <div className="page-grid">
              <section className="panel form-panel">
                <h2>Log your weight</h2>
                <p className="muted">
                  A neutral record for your personal wellbeing. Day-to-day
                  changes are normal.
                </p>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    if (Number(weight.kg) <= 0) {
                      setNotice('Enter a valid weight.');
                      return;
                    }
                    const ok = await save('weights', {
                      kg: Number(weight.kg),
                      date: weight.date,
                      note: weight.note,
                    });
                    if (ok) setWeight({ ...weight, kg: '', note: '' });
                  }}
                >
                  <label>
                    Weight (kg)
                    <input
                      type="number"
                      required
                      min="1"
                      max="500"
                      step="0.1"
                      value={weight.kg}
                      onChange={e =>
                        setWeight({ ...weight, kg: e.target.value })
                      }
                      placeholder="e.g. 60.5"
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      required
                      value={weight.date}
                      onChange={e =>
                        setWeight({ ...weight, date: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Note (optional)
                    <input
                      value={weight.note}
                      onChange={e =>
                        setWeight({ ...weight, note: e.target.value })
                      }
                      placeholder="Anything you want to remember"
                    />
                  </label>
                  <button className="primary-btn" type="submit">
                    <Plus size={16} /> Save entry
                  </button>
                </form>
                <div className="gentle-note">
                  <Sparkles size={17} />
                  <p>
                    Weight is only one measure of health. You don't need to
                    change your body to deserve good food and care.
                  </p>
                </div>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Weight history</h2>
                    <p>Your entries over time.</p>
                  </div>
                </div>
                {data.weights.length === 0 ? (
                  <div className="empty-state compact">
                    Your history will appear here after your first entry.
                  </div>
                ) : (
                  <div className="weight-list">
                    {[...data.weights]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(w => (
                        <div className="weight-entry" key={w.id}>
                          <div className="weight-icon">
                            <Scale size={18} />
                          </div>
                          <div className="entry-info">
                            <b>{w.kg} kg</b>
                            <small>
                              {w.date}
                              {w.note ? ' · ' + w.note : ''}
                            </small>
                          </div>
                          <button
                            className="icon-btn"
                            aria-label="Delete weight entry"
                            onClick={() => void remove('weights', w.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                {data.weights.length > 1 && (
                  <div className="gentle-note">
                    <Sparkles size={17} />
                    <p>
                      Look at longer-term patterns rather than individual
                      readings. Normal changes happen every day.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
          {tab === 'AI meal ideas' && (
            <div className="ai-layout">
              <section className="panel ai-hero">
                <div className="inspire-orb">
                  <Sparkles size={24} />
                </div>
                <span className="section-kicker">YOUR PANTRY, REIMAGINED</span>
                <h2>Let's make something good.</h2>
                <p>
                  Get flexible meal inspiration from your available ingredients.
                  Suggestions are ideas, not medical advice.
                </p>
                <label>
                  Anything you'd like today?
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. quick dinner, vegetarian, budget-friendly"
                  />
                </label>
                <button
                  className="primary-btn"
                  onClick={() => void getIdeas()}
                  disabled={aiBusy}
                >
                  {aiBusy ? (
                    'Thinking…'
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate meal ideas
                    </>
                  )}
                </button>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Your pantry ingredients</h2>
                    <p>These are shared with the meal idea generator.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setTab('My pantry')}
                  >
                    Manage ↗
                  </button>
                </div>
                <div className="ingredient-cloud">
                  {data.pantry.map(p => (
                    <span key={p.id}>{p.name}</span>
                  ))}
                  {data.pantry.length === 0 && (
                    <p className="muted">
                      Add a few ingredients to your pantry for more tailored
                      ideas.
                    </p>
                  )}
                </div>
                {ideas && (
                  <div className="ideas-result">
                    <div className="result-title">
                      <Sparkles size={18} /> Your meal inspiration
                    </div>
                    <p>{ideas}</p>
                    <small>
                      Check ingredient labels and cook foods safely. Nutrition
                      estimates vary by portion and preparation.
                    </small>
                  </div>
                )}
              </section>
            </div>
          )}
          <footer className="footer">
            <span>
              nourish. <span className="footer-heart">♥</span> One meal at a
              time.
            </span>
            <span>Your data is stored in this app's tracker database.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
export default App;
