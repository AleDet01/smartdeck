import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LegalPage.css';

const TermsOfServicePage = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Torna indietro">
          ← Indietro
        </button>
        
        <h1 className="legal-title">Termini di Servizio</h1>
        <p className="legal-updated">Ultimo aggiornamento: 11 Novembre 2025</p>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Accettazione dei Termini</h2>
            <p>
              Utilizzando SmartDeck, accetti questi Termini di Servizio. 
              Se non accetti questi termini, non utilizzare la piattaforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Descrizione del Servizio</h2>
            <p>
              SmartDeck è una piattaforma educativa che offre:
            </p>
            <ul>
              <li>Sistema di flashcard per apprendimento</li>
              <li>Test e quiz interattivi</li>
              <li>Statistiche personalizzate di progresso</li>
              <li>AI Assistant basato su OpenAI per supporto allo studio</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Registrazione Account</h2>
            <h3>3.1 Requisiti</h3>
            <ul>
              <li>Età minima 16 anni (o consenso genitoriale)</li>
              <li>Fornire informazioni accurate e veritiere</li>
              <li>Mantenere sicurezza password (responsabilità utente)</li>
              <li>Un account per persona</li>
            </ul>

            <h3>3.2 Responsabilità Account</h3>
            <p>
              Sei responsabile di tutte le attività svolte con il tuo account. 
              Notificaci immediatamente accessi non autorizzati.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Uso Accettabile</h2>
            <h3>4.1 È Consentito:</h3>
            <ul>
              <li>Utilizzare SmartDeck per scopi educativi personali</li>
              <li>Creare e condividere flashcard proprie</li>
              <li>Interagire con AI Assistant per supporto studio</li>
            </ul>

            <h3>4.2 È Vietato:</h3>
            <ul>
              <li>Violare diritti di proprietà intellettuale altrui</li>
              <li>Caricare contenuti illegali, offensivi, diffamatori</li>
              <li>Utilizzare bot o automazioni non autorizzate</li>
              <li>Tentare di violare sicurezza del sistema</li>
              <li>Vendere/rivendere accesso al servizio</li>
              <li>Spam o comportamenti abusivi verso altri utenti</li>
              <li>Utilizzare AI Assistant per generare contenuti dannosi</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Contenuti Utente</h2>
            <h3>5.1 Proprietà</h3>
            <p>
              Mantieni tutti i diritti sui contenuti che crei (flashcard, note). 
              Ci concedi licenza non esclusiva per fornire il servizio.
            </p>

            <h3>5.2 Responsabilità Contenuti</h3>
            <p>
              Sei responsabile dei contenuti che carichi. Non caricare materiale coperto da copyright 
              senza autorizzazione.
            </p>

            <h3>5.3 Moderazione</h3>
            <p>
              Ci riserviamo il diritto di rimuovere contenuti che violano questi termini 
              o sono illegali, senza preavviso.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. AI Assistant - Disclaimer</h2>
            <p className="warning-box">
              ⚠️ <strong>IMPORTANTE:</strong> L'AI Assistant utilizza tecnologia OpenAI (GPT) 
              e può generare risposte inaccurate o incomplete.
            </p>
            <ul>
              <li><strong>Non sostituisce docenti/professionisti:</strong> Le risposte AI sono supporto educativo, 
              non consulenza professionale</li>
              <li><strong>Verifica sempre le informazioni:</strong> Controlla risposte AI con fonti autorevoli</li>
              <li><strong>Nessuna garanzia accuratezza:</strong> Non garantiamo correttezza risposte AI</li>
              <li><strong>Non per scopi medici/legali:</strong> Mai affidarsi ad AI per consigli medici, 
              legali o finanziari</li>
              <li><strong>Limitazioni tecniche:</strong> AI può avere bias, allucinazioni, 
              conoscenza limitata post-training</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Proprietà Intellettuale</h2>
            <h3>7.1 Proprietà SmartDeck</h3>
            <p>
              SmartDeck, logo, design, software sono di nostra proprietà o licenziati. 
              Vietata riproduzione senza autorizzazione.
            </p>

            <h3>7.2 Immagini Terze Parti</h3>
            <p>
              Immagini flashcard fornite da Unsplash (licenza gratuita con attribuzione).
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Pubblicità (Futuro)</h2>
            <p>
              Potremmo introdurre pubblicità (es. Google AdSense) in futuro. 
              Se implementata:
            </p>
            <ul>
              <li>Richiederemo consenso separato per cookie pubblicitari</li>
              <li>Ads chiaramente etichettati</li>
              <li>Possibilità abbonamento premium senza ads (se disponibile)</li>
              <li>Rispetto normative advertising (IAB, Google Ads Policies)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Limitazione Responsabilità</h2>
            <p>
              SmartDeck fornito "AS IS" senza garanzie. Non siamo responsabili per:
            </p>
            <ul>
              <li>Perdita dati per cause tecniche</li>
              <li>Errori/inaccuratezze contenuti generati da AI</li>
              <li>Interruzioni servizio o downtime</li>
              <li>Danni indiretti derivanti da uso piattaforma</li>
              <li>Contenuti utente offensivi o dannosi</li>
            </ul>
            <p>
              Responsabilità massima limitata a importo pagato negli ultimi 12 mesi 
              (attualmente €0 per servizio gratuito).
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Disponibilità Servizio</h2>
            <p>
              Non garantiamo disponibilità 24/7. Potremmo sospendere servizio per:
            </p>
            <ul>
              <li>Manutenzione programmata (notifica preventiva)</li>
              <li>Emergenze tecniche</li>
              <li>Violazioni termini da parte utente</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>11. Modifiche Servizio</h2>
            <p>
              Ci riserviamo diritto di:
            </p>
            <ul>
              <li>Modificare/aggiungere/rimuovere funzionalità</li>
              <li>Cambiare prezzi (con preavviso 30 giorni)</li>
              <li>Interrompere servizio (preavviso 90 giorni)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Terminazione Account</h2>
            <h3>12.1 Terminazione da Parte Tua</h3>
            <p>
              Puoi eliminare account in qualsiasi momento dalle impostazioni 
              o contattando support@smartdeck.app
            </p>

            <h3>12.2 Terminazione da Parte Nostra</h3>
            <p>
              Possiamo sospendere/terminare account per:
            </p>
            <ul>
              <li>Violazione termini di servizio</li>
              <li>Attività illegali</li>
              <li>Abuso sistema o altri utenti</li>
              <li>Inattività prolungata (&gt;2 anni)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>13. Legge Applicabile e Foro</h2>
            <p>
              Questi termini sono regolati da legge italiana. 
              Foro competente esclusivo: Tribunale di [Città], Italia.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Risoluzione Controversie</h2>
            <p>
              Per controversie, tentare prima risoluzione amichevole contattando support@smartdeck.app. 
              Consumatori UE possono utilizzare piattaforma ODR: 
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section className="legal-section">
            <h2>15. Modifiche ai Termini</h2>
            <p>
              Potremmo aggiornare questi termini. Modifiche sostanziali notificate via email. 
              Continuando ad usare servizio dopo modifiche, accetti nuovi termini.
            </p>
          </section>

          <section className="legal-section">
            <h2>16. Contatti</h2>
            <p>
              Per domande su questi termini:<br />
              Email: <a href="mailto:support@smartdeck.app">support@smartdeck.app</a><br />
              Legal: <a href="mailto:legal@smartdeck.app">legal@smartdeck.app</a>
            </p>
          </section>

          <section className="legal-section legal-footer">
            <p>
              <strong>Clausola di Salvaguardia:</strong> Se una disposizione risulta invalida, 
              le altre rimangono valide.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
});

TermsOfServicePage.displayName = 'TermsOfServicePage';

export default TermsOfServicePage;
