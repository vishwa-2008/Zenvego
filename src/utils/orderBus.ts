// orderBus.ts — Real-time cross-client order sync using Supabase Realtime WebSockets
import { supabase } from '../lib/supabase';

export interface LiveOrder {
  id: string;
  consumer: string;
  item: string;
  qty: string;
  payout: number;
  time: string;
  status: 'pending' | 'dispatched' | 'delivered';
  deliveryCode?: string;
}

/** Publish a new or updated order to Supabase */
export async function publishOrder(order: LiveOrder) {
  try {
    // Upsert into Supabase orders table
    const { error } = await supabase.from('orders').upsert({
      id: order.id.startsWith('TXN-') ? undefined : order.id, // Generate real UUID if it's a mock ID
      customer_id: null, // We would map this to real UUIDs in a full auth flow
      items: { name: order.item, qty: order.qty },
      total_amount: order.payout,
      status: order.status,
      delivery_pin: order.deliveryCode
    });
    
    if (error) {
      console.warn("Supabase insert failed, falling back to local bus.", error);
      // Fallback for hackathon safety if SQL schema isn't run yet
      fallbackPublish(order);
    }
  } catch (err) {
    fallbackPublish(order);
  }
}

/** Get all live orders from Supabase */
export async function fetchOrders(): Promise<LiveOrder[]> {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return fallbackGetOrders();
    
    return data.map((d: any) => ({
      id: d.id,
      consumer: 'Verified Customer',
      item: d.items?.name || 'Assorted Produce',
      qty: d.items?.qty || '1 unit',
      payout: parseFloat(d.total_amount),
      time: 'Just Now',
      status: d.status,
      deliveryCode: d.delivery_pin
    }));
  } catch (err) {
    return fallbackGetOrders();
  }
}

/** Subscribe to real-time order updates via Supabase WebSockets */
export function subscribeToOrders(callback: (orders: LiveOrder[]) => void): () => void {
  // 1. Setup Supabase Realtime listener
  const channel = supabase.channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Realtime Order Event received!', payload);
        fetchOrders().then(callback);
      }
    )
    .subscribe();

  // 2. Initial fetch
  fetchOrders().then(callback);

  // 3. Fallback polling just in case WebSockets fail on restricted networks
  const interval = setInterval(() => {
    fetchOrders().then(callback);
  }, 5000);

  return () => {
    supabase.removeChannel(channel);
    clearInterval(interval);
  };
}

// --- HACKATHON FALLBACK LOGIC --- 
// (Ensures the app never breaks even if the database goes down or SQL isn't run)
const ORDER_KEY = 'zenvego_live_orders';
function fallbackPublish(order: LiveOrder) {
  const existing = fallbackGetOrders();
  const idx = existing.findIndex(o => o.id === order.id);
  if (idx !== -1) existing[idx] = order;
  else existing.unshift(order);
  localStorage.setItem(ORDER_KEY, JSON.stringify(existing));
  localStorage.setItem('zenvego_order_notification', JSON.stringify({ order, ts: Date.now() }));
}

function fallbackGetOrders(): LiveOrder[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestNotification(): { order: LiveOrder; ts: number } | null {
  try {
    const raw = localStorage.getItem('zenvego_order_notification');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function seedDefaultOrders() {
  const existing = fallbackGetOrders();
  if (existing.length === 0) {
    const defaults: LiveOrder[] = [
      { id: 'TXN-09', consumer: 'Sarah Jenkins', item: 'Organic Vine Heirloom Tomatoes', qty: '3 lbs', payout: 14.40, time: '18m ago', status: 'dispatched', deliveryCode: 'ZVG-CONFIRM-902' },
      { id: 'TXN-08', consumer: 'Sarah Jenkins', item: 'Rainbow Heirloom Carrots Bunch', qty: '1 bunch', payout: 3.50, time: '42m ago', status: 'dispatched', deliveryCode: 'ZVG-CONFIRM-811' },
    ];
    localStorage.setItem(ORDER_KEY, JSON.stringify(defaults));
  }
}
