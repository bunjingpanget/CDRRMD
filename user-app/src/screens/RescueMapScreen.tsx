import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { getWeatherVisualByCode } from '../utils/weatherVisual';

type WeatherResponse = { current?: { temperature_2m?: number; weather_code?: number } };
type Coordinate = { latitude: number; longitude: number };
type RescueCandidate = {
  area: (typeof evacuationAreas)[number];
  distanceKm: number;
  path: string[];
};
type RescuePlan = {
  area: (typeof evacuationAreas)[number];
  distanceKm: number;
  etaMinutes: number;
  etaText: string;
  routeCoordinates: Coordinate[];
  source: 'osrm' | 'dijkstra';
};

const FALLBACK_WEATHER =
  'https://api.open-meteo.com/v1/forecast?latitude=14.2117&longitude=121.1653&current=temperature_2m,weather_code&timezone=auto';

const CALAMBA_BOUNDS = {
  latMin: 14.137703,
  latMax: 14.2662133,
  lonMin: 121.0218057,
  lonMax: 121.2214277,
};

const calambaBarangays = [
  'Bagong Kalsada',
  'Bañadero',
  'Banlic',
  'Barandal',
  'Barangay 1 (Poblacion)',
  'Barangay 2 (Poblacion)',
  'Barangay 3 (Poblacion)',
  'Barangay 4 (Poblacion)',
  'Barangay 5 (Poblacion)',
  'Barangay 6 (Poblacion)',
  'Barangay 7 (Poblacion)',
  'Batino',
  'Bubuyan',
  'Bucal',
  'Bunggo',
  'Burol',
  'Camaligan',
  'Canlubang',
  'Halang',
  'Hornalan',
  'Kay-Anlog',
  'La Mesa',
  'Laguerta',
  'Lawa',
  'Lecheria',
  'Lingga',
  'Looc',
  'Mabato',
  'Majada Labas',
  'Makiling',
  'Mapagong',
  'Masili',
  'Maunong',
  'Mayapa',
  'Milagrosa',
  'Paciano Rizal',
  'Palingon',
  'Palo-Alto',
  'Pansol',
  'Parian',
  'Prinza',
  'Punta',
  'Puting Lupa',
  'Real',
  'Saimsim',
  'Sampiruhan',
  'San Cristobal',
  'San Jose',
  'San Juan',
  'Sirang Lupa',
  'Sucol',
  'Turbina',
  'Ulango',
  'Uwisan',
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const NOMINATIM_BARANGAY_CENTERS: Partial<Record<(typeof calambaBarangays)[number], Coordinate>> = {
  Hornalan: { latitude: 14.164732, longitude: 121.0638106 },
  Bunggo: { latitude: 14.157918, longitude: 121.0729918 },
  Burol: { latitude: 14.164082, longitude: 121.094613 },
  Laguerta: { latitude: 14.172736, longitude: 121.0852575 },
  Bubuyan: { latitude: 14.172324, longitude: 121.1041754 },
  Ulango: { latitude: 14.152461, longitude: 121.1167485 },
  Mabato: { latitude: 14.156822, longitude: 121.0373815 },
};

function isLandPoint(point: Coordinate) {
  if (
    point.latitude < CALAMBA_BOUNDS.latMin ||
    point.latitude > CALAMBA_BOUNDS.latMax ||
    point.longitude < CALAMBA_BOUNDS.lonMin ||
    point.longitude > CALAMBA_BOUNDS.lonMax
  ) {
    return false;
  }

  const shorelineLonByLat =
    point.latitude < 14.19
      ? 121.188
      : point.latitude < 14.205
        ? 121.195
        : point.latitude < 14.22
          ? 121.201
          : point.latitude < 14.24
            ? 121.208
            : point.latitude < 14.255
              ? 121.213
              : 121.218;

  const likelyLagunaBayWater = point.longitude > shorelineLonByLat;
  return !likelyLagunaBayWater;
}

function snapToLandPoint(rawPoint: Coordinate) {
  const start = {
    latitude: clamp(rawPoint.latitude, CALAMBA_BOUNDS.latMin + 0.001, CALAMBA_BOUNDS.latMax - 0.001),
    longitude: clamp(rawPoint.longitude, CALAMBA_BOUNDS.lonMin + 0.001, CALAMBA_BOUNDS.lonMax - 0.001),
  };

  if (isLandPoint(start)) {
    return start;
  }

  const angleSteps = 18;
  for (let ring = 1; ring <= 18; ring += 1) {
    const radius = ring * 0.0011;
    for (let step = 0; step < angleSteps; step += 1) {
      const angle = (2 * Math.PI * step) / angleSteps;
      const candidate = {
        latitude: clamp(start.latitude + Math.sin(angle) * radius, CALAMBA_BOUNDS.latMin + 0.001, CALAMBA_BOUNDS.latMax - 0.001),
        longitude: clamp(start.longitude + Math.cos(angle) * radius, CALAMBA_BOUNDS.lonMin + 0.001, CALAMBA_BOUNDS.lonMax - 0.001),
      };

      if (isLandPoint(candidate)) {
        return candidate;
      }
    }
  }

  return { latitude: 14.2117, longitude: 121.1653 };
}

function createEvacuationAreas() {
  const rows = 6;
  const cols = 9;
  const latSpan = CALAMBA_BOUNDS.latMax - CALAMBA_BOUNDS.latMin;
  const lonSpan = CALAMBA_BOUNDS.lonMax - CALAMBA_BOUNDS.lonMin;

  const siteTemplates = [
    { suffix: 'Covered Court', angleDeg: 30, radius: 0.0028 },
    { suffix: 'Elementary School', angleDeg: 160, radius: 0.0031 },
    { suffix: 'Multi-purpose Hall', angleDeg: 290, radius: 0.0029 },
  ];

  return calambaBarangays.flatMap((barangay, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const jitterLat = (((index * 37) % 9) - 4) * 0.00034;
    const jitterLon = (((index * 53) % 9) - 4) * 0.00034;
    const centerLat = CALAMBA_BOUNDS.latMin + ((row + 1) / (rows + 1)) * latSpan + jitterLat;
    const centerLon = CALAMBA_BOUNDS.lonMin + ((col + 1) / (cols + 1)) * lonSpan + jitterLon;

    const anchoredCenter = NOMINATIM_BARANGAY_CENTERS[barangay];
    const centerPoint = snapToLandPoint(
      anchoredCenter ?? { latitude: centerLat, longitude: centerLon },
    );

    return siteTemplates.map((site, siteIndex) => {
      const angle = (site.angleDeg * Math.PI) / 180;
      const rawPoint = {
        latitude: centerPoint.latitude + Math.sin(angle) * site.radius,
        longitude: centerPoint.longitude + Math.cos(angle) * site.radius,
      };
      const snapped = snapToLandPoint(rawPoint);
      const capacity = 120 + ((index * 19 + siteIndex * 41) % 240);
      const evacuees = Math.max(0, Math.floor(capacity * (0.2 + (((index + siteIndex * 3) % 6) * 0.11))));
      const placeType = site.suffix;
      const locationText = `${barangay} ${placeType}, Barangay ${barangay}, Calamba City, Laguna, Philippines`;

      return {
        id: `E${index + 1}-${siteIndex + 1}`,
        barangay,
        name: `${barangay} ${site.suffix}`,
        address: `Barangay ${barangay}, Calamba City`,
        placeType,
        locationText,
        capacity,
        evacuees,
        latitude: snapped.latitude,
        longitude: snapped.longitude,
      };
    });
  });
}

const evacuationAreas = createEvacuationAreas();

const junctionNodes: Array<{ id: string; latitude: number; longitude: number }> = [
  { id: 'J1', latitude: 14.2202, longitude: 121.1658 },
  { id: 'J2', latitude: 14.2088, longitude: 121.1768 },
  { id: 'J3', latitude: 14.2146, longitude: 121.1521 },
  { id: 'J4', latitude: 14.2012, longitude: 121.1678 },
  { id: 'J5', latitude: 14.2302, longitude: 121.1719 },
  { id: 'J6', latitude: 14.2243, longitude: 121.1908 },
  { id: 'J7', latitude: 14.1968, longitude: 121.1879 },
  { id: 'J8', latitude: 14.2355, longitude: 121.1444 },
];

const junctionEdges: Array<[string, string]> = [
  ['J1', 'J2'],
  ['J1', 'J3'],
  ['J1', 'J5'],
  ['J2', 'J4'],
  ['J2', 'J5'],
  ['J2', 'J6'],
  ['J2', 'J7'],
  ['J3', 'J5'],
  ['J3', 'J8'],
  ['J3', 'J4'],
  ['J4', 'J7'],
  ['J5', 'J6'],
  ['J5', 'J8'],
  ['J6', 'J7'],
];

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(a: Coordinate, b: Coordinate) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function buildGraph(userLocation: Coordinate) {
  const userNode = { id: 'U', latitude: userLocation.latitude, longitude: userLocation.longitude };
  const nodes = [...evacuationAreas, ...junctionNodes, userNode];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adj = new Map<string, Array<{ to: string; weight: number }>>();

  nodes.forEach((node) => adj.set(node.id, []));

  junctionEdges.forEach(([a, b]) => {
    const from = nodeMap.get(a);
    const to = nodeMap.get(b);
    if (!from || !to) {
      return;
    }

    const distance = haversineKm(from, to) * 1.28;
    adj.get(a)?.push({ to: b, weight: distance });
    adj.get(b)?.push({ to: a, weight: distance });
  });

  evacuationAreas.forEach((area) => {
    const nearestJunctions = junctionNodes
      .map((junction) => ({ id: junction.id, distance: haversineKm(area, junction) * 1.12 }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    nearestJunctions.forEach((item) => {
      adj.get(area.id)?.push({ to: item.id, weight: item.distance });
      adj.get(item.id)?.push({ to: area.id, weight: item.distance });
    });
  });

  const nearestJunctions = junctionNodes
    .map((node) => ({ id: node.id, distance: haversineKm(userNode, node) * 1.18 }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  nearestJunctions.forEach((item) => {
    adj.get('U')?.push({ to: item.id, weight: item.distance });
    adj.get(item.id)?.push({ to: 'U', weight: item.distance });
  });

  return { nodes: nodeMap, adj };
}

function dijkstra(
  adj: Map<string, Array<{ to: string; weight: number }>>,
  source: string,
  target: string,
) {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const unvisited = new Set<string>(Array.from(adj.keys()));

  unvisited.forEach((key) => {
    dist.set(key, Number.POSITIVE_INFINITY);
    prev.set(key, null);
  });
  dist.set(source, 0);

  while (unvisited.size > 0) {
    let current: string | null = null;
    let currentDist = Number.POSITIVE_INFINITY;

    unvisited.forEach((node) => {
      const nodeDist = dist.get(node) ?? Number.POSITIVE_INFINITY;
      if (nodeDist < currentDist) {
        currentDist = nodeDist;
        current = node;
      }
    });

    if (!current || current === target || currentDist === Number.POSITIVE_INFINITY) {
      break;
    }

    unvisited.delete(current);
    const neighbors = adj.get(current) ?? [];
    neighbors.forEach((neighbor) => {
      if (!unvisited.has(neighbor.to)) {
        return;
      }

      const alt = currentDist + neighbor.weight;
      if (alt < (dist.get(neighbor.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(neighbor.to, alt);
        prev.set(neighbor.to, current);
      }
    });
  }

  const path: string[] = [];
  let cursor: string | null = target;
  while (cursor) {
    path.unshift(cursor);
    cursor = prev.get(cursor) ?? null;
  }

  return {
    distanceKm: dist.get(target) ?? Number.POSITIVE_INFINITY,
    path: path[0] === source ? path : [],
  };
}

function formatEtaText(etaMinutes: number) {
  return `${Math.max(etaMinutes - 1, 1)} - ${etaMinutes + 3} mins`;
}

async function fetchRoadRoute(from: Coordinate, to: Coordinate) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};` +
    `${to.longitude},${to.latitude}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM route request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    code?: string;
    routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: number[][] } }>;
  };

  const route = payload.routes?.[0];
  const coordinates = route?.geometry?.coordinates ?? [];
  if (!route || !route.distance || !route.duration || coordinates.length === 0) {
    throw new Error('No valid OSRM route found');
  }

  return {
    distanceKm: route.distance / 1000,
    etaMinutes: Math.max(3, Math.round(route.duration / 60)),
    routeCoordinates: coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
  };
}

async function resolveFastestRoadPlan(userLocation: Coordinate): Promise<RescuePlan | null> {
  const candidateAreas = evacuationAreas
    .map((area) => ({ area, straightKm: haversineKm(area, userLocation) }))
    .sort((a, b) => a.straightKm - b.straightKm)
    .slice(0, 12)
    .map((item) => item.area);

  const routes = await Promise.all(
    candidateAreas.map(async (area) => {
      try {
        const road = await fetchRoadRoute(
          { latitude: area.latitude, longitude: area.longitude },
          userLocation,
        );

        return {
          area,
          distanceKm: road.distanceKm,
          etaMinutes: road.etaMinutes,
          etaText: formatEtaText(road.etaMinutes),
          routeCoordinates: road.routeCoordinates,
          source: 'osrm' as const,
        };
      } catch {
        return null;
      }
    }),
  );

  const valid = routes.filter(Boolean) as Array<NonNullable<(typeof routes)[number]>>;
  if (valid.length === 0) {
    return null;
  }

  valid.sort((a, b) => a.etaMinutes - b.etaMinutes);
  return valid[0];
}

function buildLeafletHtml(
  userLocation: Coordinate,
  rescuerLocation: Coordinate,
  route: Coordinate[],
  rescuerName: string,
  allAreas: typeof evacuationAreas,
  selectedAreaId: (typeof evacuationAreas)[number]['id'],
) {
  const serialized = JSON.stringify({ userLocation, rescuerLocation, route, rescuerName, allAreas, selectedAreaId });

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <style>
      html,body,#map{margin:0;padding:0;width:100%;height:100%}
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script>
      var data = ${serialized};
      var map = L.map('map', { zoomControl: true }).setView([data.userLocation.latitude, data.userLocation.longitude], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      var userMarker = L.circleMarker([data.userLocation.latitude, data.userLocation.longitude], {
        radius: 8,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.95
      }).addTo(map).bindPopup('Your location');

      var rescuerMarker = L.circleMarker([data.rescuerLocation.latitude, data.rescuerLocation.longitude], {
        radius: 8,
        color: '#15803d',
        fillColor: '#22c55e',
        fillOpacity: 0.95
      }).addTo(map).bindPopup(data.rescuerName + ' (rescuer origin)');

      var areaPinIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -22]
      });

      var selectedAreaPinIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -24]
      });

      var areaMarkers = data.allAreas.map(function(area){
        var isSelected = area.id === data.selectedAreaId;
        return L.marker([area.latitude, area.longitude], {
          icon: isSelected ? selectedAreaPinIcon : areaPinIcon
        }).addTo(map).bindPopup(
          '<strong>' + area.name + '</strong><br/>' +
          'Type: ' + area.placeType + '<br/>' +
          'Location: ' + area.locationText + '<br/>' +
          'Capacity: ' + area.capacity + '<br/>' +
          'Evacuees: ' + area.evacuees + '<br/>' +
          'Latitude: ' + area.latitude.toFixed(6) + '<br/>' +
          'Longitude: ' + area.longitude.toFixed(6) + '<br/>' +
          (isSelected ? '<br/><em>Nearest/Fastest origin</em>' : '')
        );
      });

      var routeLine = L.polyline(data.route.map(function(point){
        return [point.latitude, point.longitude];
      }), {
        color: '#0d3558',
        weight: 4,
        opacity: 0.9
      }).addTo(map);

      map.setView([data.userLocation.latitude, data.userLocation.longitude], 15);
      userMarker.openPopup();
    </script>
  </body>
</html>
`;
}

export default function RescueMapScreen() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roadPlan, setRoadPlan] = useState<RescuePlan | null>(null);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);

      try {
        const weatherResult = await api
          .get('/weather?latitude=14.2117&longitude=121.1653')
          .then((res) => res.data)
          .catch(async () => {
            const fallback = await fetch(FALLBACK_WEATHER);
            return fallback.json();
          });
        setWeather(weatherResult ?? null);
      } catch {
        setWeather(null);
      }

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } else {
          setUserLocation({ latitude: 14.2128, longitude: 121.1671 });
        }
      } catch {
        setUserLocation({ latitude: 14.2128, longitude: 121.1671 });
      }

      setLoading(false);
    }

    bootstrap().catch(() => {
      setLoading(false);
    });
  }, []);

  const visual = useMemo(
    () => getWeatherVisualByCode(weather?.current?.weather_code),
    [weather?.current?.weather_code],
  );

  const fallbackPlan = useMemo<RescuePlan | null>(() => {
    if (!userLocation) {
      return null;
    }

    const { nodes, adj } = buildGraph(userLocation);
    let best: RescueCandidate | null = null;

    for (const area of evacuationAreas) {
      const result = dijkstra(adj, area.id, 'U');
      if (!Number.isFinite(result.distanceKm)) {
        continue;
      }

      if (!best || result.distanceKm < best.distanceKm) {
        best = { area, distanceKm: result.distanceKm, path: result.path };
      }
    }

    if (!best) {
      return null;
    }

    const selected = best;

    const isRainy = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      weather?.current?.weather_code ?? -1,
    );

    const speedKmh = isRainy ? 20 : 28;
    const etaMinutes = Math.max(3, Math.round((selected.distanceKm / speedKmh) * 60));
    const routeCoordinates = selected.path
      .map((id: string) => nodes.get(id))
      .filter((item): item is { id: string; latitude: number; longitude: number } => Boolean(item))
      .map((item: { id: string; latitude: number; longitude: number }) => ({
        latitude: item.latitude,
        longitude: item.longitude,
      }));

    return {
      ...selected,
      etaMinutes,
      etaText: formatEtaText(etaMinutes),
      routeCoordinates,
      source: 'dijkstra',
    };
  }, [userLocation, weather?.current?.weather_code]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    let active = true;
    resolveFastestRoadPlan(userLocation)
      .then((plan) => {
        if (!active) {
          return;
        }
        setRoadPlan(plan);
      })
      .catch(() => {
        if (active) {
          setRoadPlan(null);
        }
      });

    return () => {
      active = false;
    };
  }, [userLocation]);

  const rescuePlan = roadPlan ?? fallbackPlan;

  const mapHtml = useMemo(() => {
    if (!userLocation || !rescuePlan) {
      return null;
    }

    return buildLeafletHtml(
      userLocation,
      { latitude: rescuePlan.area.latitude, longitude: rescuePlan.area.longitude },
      rescuePlan.routeCoordinates.length > 1
        ? rescuePlan.routeCoordinates
        : [
            { latitude: rescuePlan.area.latitude, longitude: rescuePlan.area.longitude },
            userLocation,
          ],
      rescuePlan.area.name,
      evacuationAreas,
      rescuePlan.area.id,
    );
  }, [rescuePlan, userLocation]);

  if (loading || !userLocation || !rescuePlan || !mapHtml) {
    return (
      <View style={st.loadingWrap}>
        <ActivityIndicator size="large" color="#0d3558" />
        <Text style={st.loadingText}>Preparing rescue details...</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <View style={st.header}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        <Text style={st.headerTitle}>Request Rescue</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <ImageBackground
          source={{ uri: visual.backgroundUri }}
          resizeMode="cover"
          style={st.weatherCard}
          imageStyle={{ borderRadius: 14 }}
        >
          <View style={st.weatherOverlay}>
            <Text style={st.weatherTitle}>{visual.condition}</Text>
            <Text style={st.weatherTemp}>{weather?.current?.temperature_2m ?? '--'}°C</Text>
          </View>
        </ImageBackground>

        <View style={st.statusCard}>
          <View style={st.statusRow}>
            <Text style={st.statusLabel}>Status:</Text>
            <Text style={st.statusValue}>{requestSent ? 'Team Dispatched' : 'Ready to Dispatch'}</Text>
            <Text style={st.etaText}>{rescuePlan.etaText}</Text>
          </View>
          <View style={st.progressRail}>
            <View style={[st.progressDone, requestSent ? { width: '66%' } : { width: '34%' }]} />
          </View>
          <View style={st.teamRow}>
            <MaterialCommunityIcons name="account-group" size={20} color="#0f2948" />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={st.teamName}>EMS Team Alpha</Text>
              <Text style={st.teamBase}>{rescuePlan.area.name}</Text>
            </View>
            <Text style={st.teamDistance}>{rescuePlan.distanceKm.toFixed(1)} km</Text>
          </View>
          <Text style={st.routeSourceText}>
            Route: {rescuePlan.source === 'osrm' ? 'Road network fastest path' : 'Fallback Dijkstra path'}
          </Text>
        </View>

        <View style={st.mapContainer}>
          <WebView
            style={st.map}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            startInLoadingState
          />
        </View>

        <View style={st.listWrap}>
          <View style={st.areaCard}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#dc2626" style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={st.areaName}>Your Current Location</Text>
              <Text style={st.areaAddr}>
                {userLocation.latitude.toFixed(5)}°N, {userLocation.longitude.toFixed(5)}°E
              </Text>
            </View>
          </View>

          <Text style={st.areaSectionTitle}>Evacuation Areas (Calamba City only)</Text>
          <Text style={st.areaCountText}>{evacuationAreas.length} total areas • minimum 3 per barangay</Text>
          {evacuationAreas.map((area) => {
            const isSelected = area.id === rescuePlan.area.id;
            return (
              <View key={area.id} style={[st.areaCard, isSelected ? st.areaCardSelected : null]}>
                <MaterialCommunityIcons
                  name="home-city"
                  size={20}
                  color={isSelected ? '#15803d' : '#0ea5e9'}
                  style={{ marginTop: 2 }}
                />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={st.areaName}>{area.name}</Text>
                  <Text style={st.areaMetaLabel}>Barangay:</Text>
                  <Text style={st.areaAddr}>{area.barangay}</Text>
                  <Text style={st.areaMetaLabel}>Place Type:</Text>
                  <Text style={st.areaAddr}>{area.placeType}</Text>
                  <Text style={st.areaMetaLabel}>Exact Location:</Text>
                  <Text style={st.areaAddr}>{area.locationText}</Text>
                  <Text style={st.areaMetaLabel}>Capacity:</Text>
                  <Text style={st.areaAddr}>{area.capacity}</Text>
                  <Text style={st.areaMetaLabel}>Evacuees:</Text>
                  <Text style={st.areaAddr}>{area.evacuees}</Text>
                  <Text style={st.areaMetaLabel}>Latitude:</Text>
                  <Text style={st.areaAddr}>{area.latitude.toFixed(6)}</Text>
                  <Text style={st.areaMetaLabel}>Longitude:</Text>
                  <Text style={st.areaAddr}>{area.longitude.toFixed(6)}</Text>
                  {isSelected ? <Text style={st.areaBestTag}>Nearest/Fastest rescue origin</Text> : null}
                </View>
              </View>
            );
          })}
          <View style={st.areaHintCard}>
            <Text style={st.areaHintText}>All evacuation points shown are land-based inside Calamba City only.</Text>
          </View>
          <View style={st.areaHintCard}>
            <Text style={st.areaHintText}>Each barangay has 3 separated evacuation points; route and ETA use the fastest origin.</Text>
          </View>
          <View style={st.areaCard}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#16a34a" style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={st.areaName}>Selected Rescue Origin</Text>
              <Text style={st.areaAddr}>{rescuePlan.area.name}</Text>
            </View>
          </View>
        </View>

        <View style={st.actionWrap}>
          <TouchableOpacity style={st.actionBtn} activeOpacity={0.88} onPress={() => setRequestSent(true)}>
            <Text style={st.actionText}>{requestSent ? 'Rescue Team En Route' : 'Send Rescue Request'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e5e7eb' },
  loadingWrap: { flex: 1, backgroundColor: '#eef2f7', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#475569', marginTop: 10, fontSize: 13, fontWeight: '600' },

  header: {
    backgroundColor: '#0d3558', paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 10 },

  weatherCard: { marginHorizontal: 14, marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  weatherOverlay: {
    minHeight: 94,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(10,24,44,0.38)',
  },
  weatherTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  weatherTemp: { color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginTop: 2 },

  statusCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusLabel: { color: '#16a34a', fontSize: 14 },
  statusValue: { color: '#1e293b', fontSize: 21, fontWeight: '900', marginLeft: 6, flex: 1 },
  etaText: { color: '#16a34a', fontSize: 13, fontWeight: '700' },
  progressRail: {
    marginTop: 10,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#94a3b8',
    overflow: 'hidden',
  },
  progressDone: { height: 6, backgroundColor: '#16a34a', borderRadius: 999 },
  teamRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  teamName: { color: '#0f2948', fontSize: 23, fontWeight: '900' },
  teamBase: { color: '#334155', fontSize: 11, marginTop: 1 },
  teamDistance: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  routeSourceText: { color: '#64748b', fontSize: 11, marginTop: 8 },

  mapContainer: {
    marginHorizontal: 14, marginTop: 10, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#cbd5e1', height: 250, backgroundColor: '#fff',
  },
  map: { flex: 1 },

  listWrap: { paddingHorizontal: 14, marginTop: 12 },
  areaSectionTitle: { color: '#0f2948', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  areaCountText: { color: '#475569', fontSize: 11, fontWeight: '600', marginBottom: 8 },
  areaCard: {
    backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
    marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  areaCardSelected: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  areaName: { color: '#0f2948', fontSize: 14, fontWeight: '800' },
  areaMetaLabel: { color: '#0f2948', fontSize: 11, marginTop: 5, fontWeight: '700' },
  areaAddr: { color: '#475569', fontSize: 12, marginTop: 2 },
  areaBestTag: { color: '#15803d', fontSize: 11, marginTop: 4, fontWeight: '700' },
  areaHintCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  areaHintText: { color: '#0f2948', fontSize: 11, fontWeight: '600' },

  actionWrap: { paddingHorizontal: 14, marginTop: 2 },
  actionBtn: {
    backgroundColor: '#0d3558',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  actionText: { color: '#fff', fontSize: 24, fontWeight: '900' },
});
