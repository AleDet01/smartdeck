import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LegalPage.css';

const PrivacyPolicyPage = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Torna indietro">
          ← Indietro
        </button>
        
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Ultimo aggiornamento: 11 Novembre 2025</p>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduzione</h2>
            <p>
              SmartDeck ("noi", "nostro") si impegna a proteggere la privacy degli utenti. 
              Questa Privacy Policy descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali 
              in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR) UE 2016/679 e 
              le normative italiane sulla privacy.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Titolare del Trattamento</h2>
            <p>
              Il Titolare del trattamento dei dati è SmartDeck.<br />
              Per contattarci: <a href="mailto:privacy@smartdeck.app">privacy@smartdeck.app</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Dati Raccolti</h2>
            <h3>3.1 Dati Forniti dall'Utente</h3>
            <ul>
              <li><strong>Account:</strong> Email, password (criptata), nome utente</li>
              <li><strong>Contenuti:</strong> Flashcard create, test effettuati, conversazioni con AI Assistant</li>
              <li><strong>Statistiche:</strong> Punteggi test, progressi di apprendimento, timestamp attività</li>
            </ul>

            <h3>3.2 Dati Raccolti Automaticamente</h3>
            <ul>
              <li><strong>Cookie di Sessione:</strong> Per autenticazione e gestione sessione utente</li>
              <li><strong>Preferenze:</strong> Tema (chiaro/scuro), salvato in localStorage</li>
              <li><strong>Dati Tecnici:</strong> Indirizzo IP, browser, sistema operativo (log server)</li>
            </ul>

            <h3>3.3 Cookie e Tecnologie Simili</h3>
            <ul>
              <li><strong>Cookie Necessari:</strong> Autenticazione, sicurezza sessione (obbligatori)</li>
              <li><strong>Cookie Funzionali:</strong> Preferenze tema (localStorage)</li>
              <li><strong>Cookie Pubblicitari:</strong> NON attualmente utilizzati. Se implementati in futuro, 
              richiederanno consenso esplicito separato tramite Consent Management Platform.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Finalità del Trattamento</h2>
            <p>Utilizziamo i tuoi dati per:</p>
            <ul>
              <li>Fornire e migliorare i servizi SmartDeck (flashcard, test, AI Assistant)</li>
              <li>Gestire autenticazione e sicurezza account</li>
              <li>Generare statistiche personali di apprendimento</li>
              <li>Comunicazioni tecniche e assistenza utente</li>
              <li>Rispettare obblighi legali e prevenire abusi</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Base Giuridica del Trattamento</h2>
            <ul>
              <li><strong>Esecuzione del Contratto:</strong> Fornitura servizi richiesti (Art. 6.1.b GDPR)</li>
              <li><strong>Consenso:</strong> Cookie non necessari, comunicazioni marketing (Art. 6.1.a GDPR)</li>
              <li><strong>Legittimo Interesse:</strong> Sicurezza, prevenzione frodi (Art. 6.1.f GDPR)</li>
              <li><strong>Obbligo Legale:</strong> Conservazione dati per normative fiscali (Art. 6.1.c GDPR)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Condivisione Dati con Terze Parti</h2>
            <h3>6.1 Servizi Terze Parti Utilizzati</h3>
            <ul>
              <li><strong>OpenAI API:</strong> Per funzionalità AI Assistant. I messaggi vengono inviati a OpenAI 
              per generare risposte. OpenAI ha proprie policy privacy: 
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
                OpenAI Privacy Policy
              </a></li>
              <li><strong>Unsplash API:</strong> Per immagini decorative flashcard (nessun dato personale condiviso)</li>
              <li><strong>Hosting Provider:</strong> Per server e database (con DPA - Data Processing Agreement)</li>
            </ul>

            <h3>6.2 Non Vendiamo i Tuoi Dati</h3>
            <p>
              Non vendiamo, affittiamo o scambiamo i tuoi dati personali con terze parti per scopi commerciali.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Pubblicità (Futuro)</h2>
            <p>
              Attualmente NON utilizziamo cookie pubblicitari o reti advertising. 
              Se in futuro decidessimo di implementare pubblicità (es. Google AdSense), 
              richiederemo <strong>consenso esplicito separato</strong> tramite Consent Management Platform conforme IAB TCF 2.2.
            </p>
            <p>
              Sarai sempre informato e avrai controllo completo su cookie pubblicitari e profilazione.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. I Tuoi Diritti (GDPR)</h2>
            <p>Hai diritto a:</p>
            <ul>
              <li><strong>Accesso (Art. 15):</strong> Ottenere copia dei tuoi dati</li>
              <li><strong>Rettifica (Art. 16):</strong> Correggere dati inesatti</li>
              <li><strong>Cancellazione (Art. 17):</strong> "Diritto all'oblio" - eliminare account e dati</li>
              <li><strong>Limitazione (Art. 18):</strong> Limitare il trattamento</li>
              <li><strong>Portabilità (Art. 20):</strong> Ricevere dati in formato strutturato</li>
              <li><strong>Opposizione (Art. 21):</strong> Opporti al trattamento per legittimo interesse</li>
              <li><strong>Revoca Consenso:</strong> Revocare consenso cookie/marketing in qualsiasi momento</li>
              <li><strong>Reclamo:</strong> Presentare reclamo al Garante Privacy italiano</li>
            </ul>
            <p>
              Per esercitare i tuoi diritti: <a href="mailto:privacy@smartdeck.app">privacy@smartdeck.app</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Conservazione Dati</h2>
            <ul>
              <li><strong>Account Attivi:</strong> Conservati finché l'account è attivo</li>
              <li><strong>Account Cancellati:</strong> Eliminati entro 30 giorni dalla richiesta</li>
              <li><strong>Log Server:</strong> Conservati per 12 mesi per sicurezza</li>
              <li><strong>Backup:</strong> Eliminati permanentemente entro 90 giorni</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Sicurezza</h2>
            <p>Adottiamo misure tecniche e organizzative per proteggere i tuoi dati:</p>
            <ul>
              <li>Crittografia password con bcrypt</li>
              <li>Connessioni HTTPS/TLS</li>
              <li>Cookie httpOnly e secure per sessioni</li>
              <li>Backup crittografati</li>
              <li>Accesso limitato ai dati (principio minimo privilegio)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>11. Minori</h2>
            <p>
              SmartDeck non è destinato a minori di 16 anni senza consenso genitoriale. 
              Se veniamo a conoscenza di dati raccolti da minori senza consenso, li cancelliamo immediatamente.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Trasferimenti Internazionali</h2>
            <p>
              I dati possono essere trasferiti a fornitori extra-UE (es. OpenAI - USA) 
              con garanzie adeguate (Standard Contractual Clauses, Privacy Shield successor).
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Modifiche a Questa Policy</h2>
            <p>
              Potremmo aggiornare questa Privacy Policy. Ti notificheremo modifiche sostanziali via email 
              o banner nel sito. Data ultimo aggiornamento sempre indicata in alto.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contatti</h2>
            <p>
              Per domande su questa Privacy Policy o esercitare i tuoi diritti:<br />
              Email: <a href="mailto:privacy@smartdeck.app">privacy@smartdeck.app</a><br />
              Risponderemo entro 30 giorni come da GDPR.
            </p>
          </section>

          <section className="legal-section legal-footer">
            <p>
              <strong>Autorità di Controllo:</strong> Garante per la protezione dei dati personali<br />
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
                www.garanteprivacy.it
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
});

PrivacyPolicyPage.displayName = 'PrivacyPolicyPage';

export default PrivacyPolicyPage;
