import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from './Footer';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex flex-col">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('event.backButton')}
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Informazioni Generali</h2>
              <p>
                PartyPool è un'applicazione che permette di organizzare raccolte fondi per eventi e regali.
                Questa privacy policy descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dati Raccolti</h2>
              <p className="mb-2">Raccogliamo le seguenti informazioni:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Indirizzo email (per la registrazione e autenticazione)</li>
                <li>Nome e cognome (quando forniti per contributi e auguri)</li>
                <li>Informazioni sull'evento (nome del festeggiato, data, descrizione)</li>
                <li>Importi delle contribuzioni</li>
                <li>Messaggi e auguri lasciati dagli invitati</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Utilizzo dei Dati</h2>
              <p className="mb-2">Utilizziamo i tuoi dati per:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fornire i servizi di PartyPool</li>
                <li>Gestire gli eventi e le raccolte fondi</li>
                <li>Comunicare con gli utenti riguardo ai loro eventi</li>
                <li>Migliorare l'esperienza utente</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Amazon Associates Program</h2>
              <p className="mb-2">
                PartyPool partecipa al Programma Affiliazione Amazon EU, un programma di affiliazione che consente
                ai siti di percepire una commissione pubblicitaria pubblicizzando e fornendo link al sito Amazon.it.
              </p>
              <p className="font-semibold">
                In qualità di Affiliato Amazon, PartyPool riceve un guadagno dagli acquisti idonei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Condivisione dei Dati</h2>
              <p>
                Non vendiamo, affittiamo o condividiamo i tuoi dati personali con terze parti,
                eccetto quando necessario per fornire i servizi (es: servizi di hosting e database)
                o quando richiesto dalla legge.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Sicurezza</h2>
              <p>
                Implementiamo misure di sicurezza appropriate per proteggere i tuoi dati personali
                da accessi non autorizzati, alterazioni, divulgazione o distruzione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cookie</h2>
              <p>
                Utilizziamo cookie tecnici necessari per il funzionamento dell'applicazione,
                inclusi quelli per l'autenticazione degli utenti.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. I Tuoi Diritti</h2>
              <p className="mb-2">Hai il diritto di:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Accedere ai tuoi dati personali</li>
                <li>Richiedere la correzione di dati inesatti</li>
                <li>Richiedere la cancellazione dei tuoi dati</li>
                <li>Opporti al trattamento dei tuoi dati</li>
                <li>Richiedere la portabilità dei dati</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Modifiche alla Privacy Policy</h2>
              <p>
                Ci riserviamo il diritto di modificare questa privacy policy in qualsiasi momento.
                Le modifiche saranno pubblicate su questa pagina con la data di aggiornamento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contatti</h2>
              <p>
                Per qualsiasi domanda riguardante questa privacy policy o per esercitare i tuoi diritti,
                puoi contattarci tramite i canali disponibili sul sito.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Ultimo aggiornamento: 12 Febbraio 2026
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
