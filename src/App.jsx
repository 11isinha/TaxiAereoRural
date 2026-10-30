import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Browser } from '@capacitor/browser';

const STORAGE_KEY = 'taxiaereorural-registros-v1';

function readRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function App() {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState(readRecords);
  const [placeName, setPlaceName] = useState('');
  const [pilot, setPilot] = useState('');
  const [notes, setNotes] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  async function captureLocation() {
    setLoading(true);
    setError('');
    setSavedMessage('');
    setPosition(null);

    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Para capturar o GPS nativo, abra o aplicativo no Android. A prévia do navegador não substitui o teste no celular.');
      }

      let permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        permission = await Geolocation.requestPermissions();
      }
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        throw new Error('Permissão de localização não concedida. Autorize o acesso nas configurações do Android.');
      }

      const result = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      });

      setPosition({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: result.timestamp
      });
    } catch (err) {
      console.error('Falha ao obter localização:', err);
      const message = String(err?.message || 'Não foi possível obter a localização.');
      if (message.toLowerCase().includes('location services') || message.toLowerCase().includes('disabled')) {
        setError('O serviço de localização do celular está desligado. Ative o GPS e tente novamente.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function saveCheckIn(event) {
    event.preventDefault();
    if (!position) {
      setError('Capture a localização antes de registrar o check-in.');
      return;
    }
    if (!placeName.trim()) {
      setError('Informe o nome ou identificação da pista.');
      return;
    }

    const record = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      placeName: placeName.trim(),
      pilot: pilot.trim(),
      notes: notes.trim(),
      ...position,
      createdAt: new Date().toISOString()
    };
    setRecords((current) => [record, ...current]);
    setPlaceName('');
    setPilot('');
    setNotes('');
    setSavedMessage('Check-in registrado neste dispositivo.');
    setError('');
  }

  async function openMaps(item) {
    const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
    await Browser.open({ url });
  }

  function deleteRecord(id) {
    setRecords((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark">✈</div>
        <div>
          <p className="eyebrow">GESTÃO DE PISTAS RURAIS</p>
          <h1>TaxiAereoRural</h1>
        </div>
        <span className="student-tag">ALUNO 13</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="pill"><span className="live-dot" /> CHECK-IN DE LOCALIZAÇÃO</span>
          <h2>Registre. Localize.<br /><em>Organize.</em></h2>
          <p>Registre pontos de pouso em áreas rurais com coordenadas obtidas pelo GPS do dispositivo.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="radar radar-one" /><div className="radar radar-two" /><div className="plane">✈</div><div className="map-pin">⌖</div></div>
      </section>

      <section className="content-grid">
        <article className="panel location-panel">
          <div className="section-heading"><div><p className="eyebrow">ETAPA 01</p><h3>Localização atual</h3></div><span className="icon-chip">⌖</span></div>
          <p className="muted">Ative a localização do celular e permita o acesso quando o Android solicitar.</p>
          <button className="primary-button" onClick={captureLocation} disabled={loading}>
            <span>{loading ? '◌' : '⌖'}</span>{loading ? 'Buscando sinal GPS...' : 'Capturar minha localização'}
          </button>
          {error && <div className="notice error-notice">{error}</div>}
          {savedMessage && <div className="notice success-notice">✓ {savedMessage}</div>}
          {position ? (
            <div className="coordinates-card">
              <div className="coordinates-top"><span className="status-dot" /> COORDENADAS CAPTURADAS <span className="accuracy">± {position.accuracy.toFixed(1)} m</span></div>
              <div className="coordinate-row"><span>Latitude</span><strong>{position.latitude.toFixed(6)}</strong></div>
              <div className="coordinate-row"><span>Longitude</span><strong>{position.longitude.toFixed(6)}</strong></div>
              <div className="coordinate-row"><span>Precisão informada pelo GPS</span><strong>{position.accuracy.toFixed(1)} metros</strong></div>
              <button className="map-button" onClick={() => openMaps(position)}>Abrir localização no Google Maps ↗</button>
            </div>
          ) : (
            <div className="empty-location"><span>◎</span><strong>Aguardando coordenadas</strong><small>Latitude, longitude e precisão aparecerão aqui.</small></div>
          )}
        </article>

        <article className="panel form-panel">
          <div className="section-heading"><div><p className="eyebrow">ETAPA 02</p><h3>Registrar ponto de pouso</h3></div><span className="icon-chip">＋</span></div>
          <p className="muted">Preencha os dados da pista e vincule o registro à localização capturada.</p>
          <form onSubmit={saveCheckIn}>
            <label>Nome ou identificação da pista<input value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="Ex.: Pista Fazenda Boa Vista" /></label>
            <label>Responsável pelo registro <span className="optional">(opcional)</span><input value={pilot} onChange={(e) => setPilot(e.target.value)} placeholder="Nome do responsável" /></label>
            <label>Observações <span className="optional">(opcional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições informadas, referências do local..." rows="3" /></label>
            <button className="dark-button" type="submit" disabled={!position}>Salvar check-in <span>→</span></button>
            {!position && <small className="form-hint">Primeiro capture as coordenadas para liberar o registro.</small>}
          </form>
        </article>
      </section>

      <section className="panel records-panel">
        <div className="section-heading records-heading"><div><p className="eyebrow">HISTÓRICO LOCAL</p><h3>Registros deste dispositivo</h3></div><span className="count-badge">{records.length} {records.length === 1 ? 'registro' : 'registros'}</span></div>
        {records.length === 0 ? <div className="records-empty">Nenhum check-in salvo ainda. Depois de registrar um ponto, ele aparecerá nesta lista.</div> : (
          <div className="record-list">
            {records.map((item) => <div className="record-item" key={item.id}>
              <div className="record-symbol">⌖</div>
              <div className="record-info"><strong>{item.placeName}</strong><span>{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)} · precisão ±{item.accuracy.toFixed(1)} m</span><small>{new Date(item.createdAt).toLocaleString('pt-BR')}{item.pilot ? ` · ${item.pilot}` : ''}</small>{item.notes && <p>{item.notes}</p>}</div>
              <div className="record-actions"><button onClick={() => openMaps(item)}>Mapa ↗</button><button className="delete-button" onClick={() => deleteRecord(item.id)} aria-label="Excluir registro">Excluir</button></div>
            </div>)}
          </div>
        )}
      </section>

      <footer><span>TaxiAereoRural · Projeto acadêmico</span><span>Os registros ficam salvos somente neste aparelho.</span></footer>
    </main>
  );
}
