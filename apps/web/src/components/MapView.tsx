import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Equipment, Coordinate, GeoJSONLineString } from '@equip-nav/contracts';

interface MapViewProps {
  equipments: Equipment[];
  selectedEquipment: Equipment | null;
  origin: Coordinate | null;
  destination: Coordinate | null;
  viaEquipments: Equipment[];
  routeGeometry: GeoJSONLineString | null;
  onSelectEquipment: (eq: Equipment) => void;
  onSetOrigin: (coord: Coordinate) => void;
  onSetDestination: (coord: Coordinate) => void;
  onAddVia: (eq: Equipment) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  equipments,
  routeGeometry,
  onSelectEquipment,
  onSetOrigin,
  onSetDestination,
  onAddVia,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapNotice, setMapNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Register PMTiles Protocol
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    // Offline style configuration using local pmtiles tile endpoint
    const offlineStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'korea-pmtiles': {
          type: 'vector',
          url: 'pmtiles:///api/v1/map/tiles/korea.pmtiles',
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#f8fafc',
          },
        },
        {
          id: 'korea-polygons',
          type: 'fill',
          source: 'korea-pmtiles',
          'source-layer': 'landuse',
          paint: {
            'fill-color': '#e2e8f0',
            'fill-opacity': 0.6,
          },
        },
      ],
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: offlineStyle,
      center: [127.0, 37.5], // Center of Korea / Seoul
      zoom: 7,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.current.on('error', (e) => {
      if (e.error?.message?.includes('404') || e.error?.message?.includes('pmtiles')) {
        setMapNotice('오프라인 대한민국 지도 파일(korea.pmtiles)이 준비되지 않았습니다. 기본 그리드 모드로 동작합니다.');
      }
    });

    // Handle Right Click for setting arbitrary coordinates
    map.current.on('contextmenu', (e) => {
      const coord: Coordinate = [e.lngLat.lng, e.lngLat.lat];
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 space-y-2 text-xs font-sans';
      popupContent.innerHTML = `
        <div class="font-bold text-slate-800">지점 선택</div>
        <div class="text-slate-500">${coord[0].toFixed(5)}, ${coord[1].toFixed(5)}</div>
        <div class="flex gap-1 pt-1">
          <button id="btn-set-origin" class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">출발지로 지정</button>
          <button id="btn-set-dest" class="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">목적지로 지정</button>
        </div>
      `;

      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true })
        .setLngLat(e.lngLat)
        .setDOMContent(popupContent)
        .addTo(map.current!);

      setTimeout(() => {
        popupContent.querySelector('#btn-set-origin')?.addEventListener('click', () => {
          onSetOrigin(coord);
          popupRef.current?.remove();
        });
        popupContent.querySelector('#btn-set-dest')?.addEventListener('click', () => {
          onSetDestination(coord);
          popupRef.current?.remove();
        });
      }, 50);
    });

    map.current.on('load', () => {
      // Add Sources & Layers for Route GeoJSON
      map.current!.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.current!.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.8,
        },
      });

      // Equipment GeoJSON Source & Cluster Layers
      map.current!.addSource('equipment-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'equipment-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 25, 50, 30],
          'circle-opacity': 0.85,
        },
      });

      map.current!.addLayer({
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

      map.current!.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'equipment-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'NORMAL',
            '#22c55e',
            'WARNING',
            '#eab308',
            'ERROR',
            '#ef4444',
            'MAINTENANCE',
            '#a855f7',
            '#64748b',
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Equipment Point Click Popup
      map.current!.on('click', 'unclustered-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties as any;
        const coordinates = (feature.geometry as any).coordinates.slice();

        const eq = equipments.find((item) => item.equipment_id === props.equipment_id);
        if (eq) {
          onSelectEquipment(eq);
        }

        const popupDiv = document.createElement('div');
        popupDiv.className = 'p-2 font-sans space-y-1 text-xs';
        popupDiv.innerHTML = `
          <div class="font-bold text-sm text-slate-800">${props.name} (${props.equipment_id})</div>
          <div class="text-slate-600">${props.address || '주소 정보 없음'}</div>
          <div class="text-slate-500 font-mono">상태: ${props.status} | 유형: ${props.equipment_type}</div>
          <div class="flex gap-1 pt-2">
            <button id="btn-popup-origin" class="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">출발지 지정</button>
            <button id="btn-popup-dest" class="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700">목적지 지정</button>
            <button id="btn-popup-via" class="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700">+ 경유지 추가</button>
          </div>
        `;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true })
          .setLngLat(coordinates)
          .setDOMContent(popupDiv)
          .addTo(map.current!);

        setTimeout(() => {
          popupDiv.querySelector('#btn-popup-origin')?.addEventListener('click', () => {
            onSetOrigin([props.longitude, props.latitude]);
            popupRef.current?.remove();
          });
          popupDiv.querySelector('#btn-popup-dest')?.addEventListener('click', () => {
            onSetDestination([props.longitude, props.latitude]);
            popupRef.current?.remove();
          });
          popupDiv.querySelector('#btn-popup-via')?.addEventListener('click', () => {
            if (eq) onAddVia(eq);
            popupRef.current?.remove();
          });
        }, 50);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update Equipment Markers Source
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('equipment-source') as maplibregl.GeoJSONSource;
    if (source) {
      const features: GeoJSON.Feature[] = equipments.map((eq) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [eq.longitude, eq.latitude],
        },
        properties: {
          equipment_id: eq.equipment_id,
          name: eq.name,
          address: eq.address,
          status: eq.status,
          equipment_type: eq.equipment_type,
          latitude: eq.latitude,
          longitude: eq.longitude,
        },
      }));

      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [equipments]);

  // Update Route Polyline Layer
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('route-source') as maplibregl.GeoJSONSource;
    if (source) {
      if (routeGeometry) {
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: routeGeometry as any,
              properties: {},
            },
          ],
        });

        // Fit Bounds
        if (routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
          const bounds = routeGeometry.coordinates.reduce(
            (b, coord) => b.extend(coord as [number, number]),
            new maplibregl.LngLatBounds(routeGeometry.coordinates[0] as [number, number], routeGeometry.coordinates[0] as [number, number])
          );
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
      } else {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }
  }, [routeGeometry]);

  return (
    <div className="relative w-full h-full flex-1 bg-slate-100">
      {mapNotice && (
        <div className="absolute top-3 left-3 z-10 max-w-md bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 rounded text-xs shadow-md">
          {mapNotice}
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
