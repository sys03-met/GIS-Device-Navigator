import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';

// Register PMTiles Protocol
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

interface MapViewProps {
  onMapClick?: (lng: number, lat: number) => void;
  onMarkerClick?: (equipmentId: string) => void;
  equipments?: any[];
  routeGeoJson?: any;
  originCoord?: [number, number] | null;
  destinationCoord?: [number, number] | null;
}

export const MapView: React.FC<MapViewProps> = ({
  onMapClick,
  onMarkerClick,
  equipments = [],
  routeGeoJson,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pmtilesAvailable, setPmtilesAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check PMTiles availability
    fetch('/tiles/korea.pmtiles', { method: 'HEAD' })
      .then(res => {
        setPmtilesAvailable(res.ok || res.status === 206);
      })
      .catch(() => setPmtilesAvailable(false));

    // Offline Base Style Specification for PMTiles vector tiles
    const style: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'korea-pmtiles': {
          type: 'vector',
          url: 'pmtiles:///tiles/korea.pmtiles',
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#0f172a',
          },
        },
        {
          id: 'water',
          type: 'fill',
          source: 'korea-pmtiles',
          'source-layer': 'water',
          paint: {
            'fill-color': '#1e293b',
          },
        },
        {
          id: 'landuse',
          type: 'fill',
          source: 'korea-pmtiles',
          'source-layer': 'landuse',
          paint: {
            'fill-color': '#1e293b',
            'fill-opacity': 0.5,
          },
        },
        {
          id: 'roads',
          type: 'line',
          source: 'korea-pmtiles',
          'source-layer': 'transportation',
          paint: {
            'line-color': '#334155',
            'line-width': 1.5,
          },
        },
        {
          id: 'place-labels',
          type: 'symbol',
          source: 'korea-pmtiles',
          'source-layer': 'place',
          layout: {
            'text-field': '{name:ko}',
            'text-size': 12,
          },
          paint: {
            'text-color': '#94a3b8',
          },
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [127.7669, 35.9078], // South Korea Center
      zoom: 7,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);

      // Add Source for Route Line
      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 5,
          'line-opacity': 0.85,
        },
      });

      // Add Source for Equipment Markers GeoJSON
      map.addSource('equipment-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster Layer
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'equipment-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'equipment-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Unclustered Point Layer
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'equipment-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'NORMAL', '#22c55e',
            'INSPECTION', '#f59e0b',
            'REPAIR', '#ea580c',
            'DISABLED', '#ef4444',
            '#a855f7'
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    });

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick(e.lngLat.lng, e.lngLat.lat);
      }
    });

    map.on('click', 'unclustered-point', (e) => {
      if (e.features && e.features[0] && onMarkerClick) {
        const eqId = e.features[0].properties?.equipment_id;
        if (eqId) onMarkerClick(eqId);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update Route GeoJSON
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('route-source') as maplibregl.GeoJSONSource;
    if (source) {
      if (routeGeoJson) {
        source.setData(routeGeoJson);
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [routeGeoJson, mapLoaded]);

  // Update Equipment Markers GeoJSON
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('equipment-source') as maplibregl.GeoJSONSource;
    if (source) {
      const features = equipments.map(eq => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [eq.longitude, eq.latitude],
        },
        properties: {
          id: eq.id,
          equipment_id: eq.equipment_id,
          name: eq.name,
          status: eq.status,
          type: eq.equipment_type,
        },
      }));
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [equipments, mapLoaded]);

  return (
    <div className="map-viewport">
      {pmtilesAvailable === false && (
        <div className="offline-notice-banner">
          ⚠️ 대한민국 PMTiles 타일 파일이 로드되지 않았습니다 (`data/korea.pmtiles` 필요).
        </div>
      )}
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
};
