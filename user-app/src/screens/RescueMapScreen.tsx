import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const leafletHtml = `
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
      var map=L.map('map',{zoomControl:true}).setView([14.2117,121.1653],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; OpenStreetMap contributors'
      }).addTo(map);
      var poly=L.polygon([
        [14.1649,121.1045],[14.2943,121.1045],
        [14.2943,121.2305],[14.1649,121.2305]
      ],{color:'#0a4870',weight:2,fillColor:'#0a4870',fillOpacity:0.18}).addTo(map);
      [[14.2112,121.1654],[14.2268,121.1516],[14.1962,121.1779],[14.2159,121.1894]].forEach(function(p){
        L.circleMarker(p,{radius:7,color:'#16a34a',fillColor:'#22c55e',fillOpacity:0.9}).addTo(map);
      });
      map.fitBounds(poly.getBounds(),{padding:[18,18]});
    </script>
  </body>
</html>
`;

const evacuationAreas = [
  { id: 1, name: 'Calamba City Hall Covered Court', address: 'Barangay Real, Calamba City' },
  { id: 2, name: 'Banlic Covered Court', address: 'Barangay Banlic, Calamba City' },
  { id: 3, name: 'Canlubang Gymnasium', address: 'Barangay Canlubang, Calamba City' },
  { id: 4, name: 'Mayapa Multi-purpose Hall', address: 'Barangay Mayapa, Calamba City' },
];

export default function RescueMapScreen() {
  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        <Text style={st.headerTitle}>Safe Zone - Calamba</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Info banner */}
        <View style={st.bannerWrap}>
          <View style={st.banner}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color="#166534" />
            <Text style={st.bannerText}>
              Evacuation areas shown are within Calamba City only.
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={st.mapContainer}>
          <WebView
            style={st.map}
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            startInLoadingState
          />
        </View>

        {/* Evacuation list */}
        <View style={st.listWrap}>
          {evacuationAreas.map((area) => (
            <View key={area.id} style={st.areaCard}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#15803d" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={st.areaName}>{area.name}</Text>
                <Text style={st.areaAddr}>{area.address}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e5e7eb' },

  header: {
    backgroundColor: '#0d3558', paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 10 },

  bannerWrap: { paddingHorizontal: 14, paddingTop: 12 },
  banner: {
    backgroundColor: '#d8ebe0', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  bannerText: { color: '#166534', fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1, lineHeight: 18 },

  mapContainer: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#cbd5e1', height: 240, backgroundColor: '#fff',
  },
  map: { flex: 1 },

  listWrap: { paddingHorizontal: 14, marginTop: 12 },
  areaCard: {
    backgroundColor: '#f3f4f6', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12,
    marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start',
  },
  areaName: { color: '#0f2948', fontSize: 14, fontWeight: '800' },
  areaAddr: { color: '#475569', fontSize: 12, marginTop: 2 },
});
