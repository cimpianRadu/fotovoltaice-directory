'use client';

import { useEffect, useState } from 'react';

interface PromoRotatorProps<T> {
  items: T[];
  max: number;
  keyOf: (item: T) => string | number;
  render: (item: T, idx: number) => React.ReactNode;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PromoRotator<T>({ items, max, keyOf, render }: PromoRotatorProps<T>) {
  const [order, setOrder] = useState<T[]>(() => items.slice(0, max));

  useEffect(() => {
    setOrder(shuffle(items).slice(0, max));
  }, [items, max]);

  return (
    <>
      {order.map((item, idx) => (
        <div key={keyOf(item)}>{render(item, idx)}</div>
      ))}
    </>
  );
}
