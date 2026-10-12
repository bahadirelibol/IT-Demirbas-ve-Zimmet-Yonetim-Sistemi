import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, codeFromScan } from './src/api';
import {
  formatDate,
  statusLabels,
  typeLabels,
  type AssetDetail,
  type Assignment,
  type Person,
  type SessionUser,
} from './src/types';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Scan: undefined;
  Asset: { code: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token')
      .then(async (token) => {
        if (!token) return;
        const me = await api<SessionUser>('/auth/me');
        setUser(me);
      })
      .catch(() => AsyncStorage.removeItem('token'))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0f2744' },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: '#f3f6fb' },
          }}
        >
          {user ? (
            <>
              <Stack.Screen name="Home" options={{ title: 'Zimmetlerim' }}>
                {({ navigation }) => (
                  <HomeScreen
                    user={user}
                    onScan={() => navigation.navigate('Scan')}
                    onOpen={(code) => navigation.navigate('Asset', { code })}
                    onLogout={async () => {
                      await AsyncStorage.removeItem('token');
                      setUser(null);
                    }}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Scan" options={{ title: 'QR okut', headerShown: false }}>
                {({ navigation }) => (
                  <ScanScreen
                    onClose={() => navigation.goBack()}
                    onCode={(code) => navigation.replace('Asset', { code })}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Asset" options={{ title: 'Cihaz' }}>
                {({ route }) => <AssetScreen code={route.params.code} user={user} />}
              </Stack.Screen>
            </>
          ) : (
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {() => <LoginScreen onSuccess={setUser} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.login}>
      <Text style={styles.kicker}>Kurum içi</Text>
      <Text style={styles.loginTitle}>Demirbaş Zimmet</Text>
      <Text style={styles.muted}>Saha işlemleri için giriş yapın.</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.primary}
        disabled={loading}
        onPress={async () => {
          setLoading(true);
          setError('');
          try {
            const result = await api<{ accessToken: string; user: SessionUser }>('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email, password }),
            });
            await AsyncStorage.setItem('token', result.accessToken);
            const me = await api<SessionUser>('/auth/me');
            onSuccess(me);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Giriş başarısız');
          } finally {
            setLoading(false);
          }
        }}
      >
        <Text style={styles.primaryText}>{loading ? 'Giriş yapılıyor...' : 'Giriş yap'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function HomeScreen({
  user,
  onScan,
  onOpen,
  onLogout,
}: {
  user: SessionUser;
  onScan: () => void;
  onOpen: (code: string) => void;
  onLogout: () => void;
}) {
  const [rows, setRows] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const result = await api<{ data: Assignment[] }>('/me/assets');
      setRows(result.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste alınamadı');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.homeHead}>
        <View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.muted}>{user.role === 'ADMIN' ? 'Yönetici' : 'Personel'}</Text>
        </View>
        <Pressable onPress={onLogout}>
          <Text style={styles.link}>Çıkış</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.primary, styles.inset]} onPress={onScan}>
        <Text style={styles.primaryText}>QR okut</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? null : <Text style={styles.muted}>Açık zimmetiniz yok.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => item.asset && onOpen(item.asset.qrCode)}>
            <Text style={styles.cardKicker}>{item.asset ? typeLabels[item.asset.type] : ''}</Text>
            <Text style={styles.cardTitle}>
              {item.asset?.brand} {item.asset?.model}
            </Text>
            <Text style={styles.muted}>Seri no: {item.asset?.serialNumber}</Text>
            <Text style={styles.muted}>QR: {item.asset?.qrCode}</Text>
            <Text style={styles.muted}>Garanti: {formatDate(item.asset?.warrantyExpiresAt)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function ScanScreen({ onClose, onCode }: { onClose: () => void; onCode: (code: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.login}>
        <Text style={styles.loginTitle}>Kamera izni</Text>
        <Text style={styles.muted}>QR kodu okutmak için kameraya izin verin.</Text>
        <Pressable style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>İzin ver</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text style={styles.link}>Vazgeç</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          locked
            ? undefined
            : ({ data }) => {
                setLocked(true);
                onCode(codeFromScan(data));
              }
        }
      />
      <SafeAreaView style={styles.cameraBar}>
        <Text style={styles.cameraHint}>QR kodu çerçevenin içine getirin</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.primaryText}>Kapat</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function AssetScreen({ code, user }: { code: string; user: SessionUser }) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const detail = await api<AssetDetail>(`/assets/by-code/${encodeURIComponent(code)}`);
      setAsset(detail);
      setError('');
      if (user.role === 'ADMIN') {
        const lookup = await api<Person[]>('/users/lookup');
        setPeople(lookup);
        setUserId(lookup[0]?.id ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cihaz bulunamadı');
    }
  }

  useEffect(() => {
    void load();
  }, [code]);

  if (error && !asset) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!asset) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  const openAssignment = asset.assignments.find((item) => !item.returnedAt);
  const isAdmin = user.role === 'ADMIN';
  const canFault = isAdmin || openAssignment?.user.id === user.id;

  async function run(action: () => Promise<void>) {
    setMessage('');
    setError('');
    try {
      await action();
      setNote('');
      setMessage('İşlem kaydedildi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.detail}>
      <Text style={styles.cardKicker}>{typeLabels[asset.type]}</Text>
      <Text style={styles.cardTitle}>
        {asset.brand} {asset.model}
      </Text>
      <Text style={styles.badge}>{statusLabels[asset.status]}</Text>
      <Text style={styles.line}>Seri no: {asset.serialNumber}</Text>
      <Text style={styles.line}>QR: {asset.qrCode}</Text>
      <Text style={styles.line}>Alım: {formatDate(asset.purchaseDate)}</Text>
      <Text style={styles.line}>Garanti: {formatDate(asset.warrantyExpiresAt)}</Text>
      <Text style={styles.line}>Departman: {asset.department.name}</Text>
      <Text style={styles.line}>Kimde: {openAssignment?.user.fullName ?? '—'}</Text>
      {asset.notes ? <Text style={styles.line}>Not: {asset.notes}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="İşlem notu"
        value={note}
        onChangeText={setNote}
      />
      {isAdmin && !openAssignment && asset.status !== 'RETIRED' && asset.status !== 'FAULTY' ? (
        <View style={styles.block}>
          <Text style={styles.line}>Teslim edilecek personel</Text>
          {people.map((person) => (
            <Pressable key={person.id} onPress={() => setUserId(person.id)}>
              <Text style={userId === person.id ? styles.selected : styles.muted}>{person.fullName}</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.primary}
            onPress={() =>
              void run(() =>
                api('/assignments', {
                  method: 'POST',
                  body: JSON.stringify({ assetId: asset.id, userId, note }),
                }),
              )
            }
          >
            <Text style={styles.primaryText}>Personele teslim et</Text>
          </Pressable>
        </View>
      ) : null}
      {isAdmin && openAssignment ? (
        <Pressable
          style={styles.secondary}
          onPress={() =>
            void run(() =>
              api(`/assignments/${openAssignment.id}/return`, {
                method: 'POST',
                body: JSON.stringify({ note }),
              }),
            )
          }
        >
          <Text style={styles.secondaryText}>Cihazı geri kabul et</Text>
        </Pressable>
      ) : null}
      {canFault && asset.status !== 'RETIRED' ? (
        <Pressable
          style={styles.danger}
          onPress={() =>
            void run(() =>
              api(`/assets/${asset.id}/fault`, {
                method: 'POST',
                body: JSON.stringify({ note }),
              }),
            )
          }
        >
          <Text style={styles.primaryText}>Arıza durumu bildir</Text>
        </Pressable>
      ) : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f6fb' },
  login: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f3f6fb', gap: 12 },
  kicker: { color: '#0f766e', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
  loginTitle: { fontSize: 32, fontWeight: '700', color: '#0f2744' },
  screen: { flex: 1, backgroundColor: '#f3f6fb' },
  homeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  name: { fontSize: 18, fontWeight: '700', color: '#0f2744' },
  muted: { color: '#64748b', marginTop: 2 },
  link: { color: '#0f766e', fontWeight: '700' },
  inset: { marginHorizontal: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  primary: { backgroundColor: '#0f766e', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8 },
  secondaryText: { color: '#0f2744', fontWeight: '700' },
  danger: { backgroundColor: '#e11d48', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  error: { color: '#e11d48', marginHorizontal: 16, marginTop: 8 },
  ok: { color: '#0f766e', marginTop: 8, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardKicker: { color: '#64748b', fontSize: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0f2744', marginBottom: 6 },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, gap: 12, backgroundColor: 'rgba(15,39,68,0.72)' },
  cameraHint: { color: '#fff', textAlign: 'center' },
  detail: { padding: 16, gap: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#ccfbf1', color: '#115e59', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginVertical: 8 },
  line: { color: '#0f172a', marginTop: 4 },
  block: { marginTop: 12, gap: 6 },
  selected: { color: '#0f766e', fontWeight: '700', paddingVertical: 4 },
});
