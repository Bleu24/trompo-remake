'use client';

import { useEffect, useRef } from 'react';

interface Business {
  _id: string;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function BusinessMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = async () => {
      if (!mapRef.current) return;
      const googleMaps = (window as any).google;
      const map = new googleMaps.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 3,
      });

      try {
        const res = await fetch('/api/businesses');
        const businesses: Business[] = await res.json();
        businesses.forEach((b) => {
          if (
            b.location &&
            typeof b.location.latitude === 'number' &&
            typeof b.location.longitude === 'number'
          ) {
            new googleMaps.maps.Marker({
              position: { lat: b.location.latitude, lng: b.location.longitude },
              map,
              title: b.name,
            });
          }
        });
      } catch (err) {
        console.error('Failed to load businesses', err);
      }
    };

    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div ref={mapRef} style={{ height: '500px', width: '100%' }} />;
}
