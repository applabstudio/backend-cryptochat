const Express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const cron = require('node-cron')
const parser = require('cron-parser')

const app = Express() // Crea un'istanza di Express

// Utilizza il middleware integrato per il parsing del corpo JSON
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Crea un'istanza di Firebase
const serviceAccount = require('./encryptedchatapp-cd362-firebase-adminsdk-zm64w-6f677d76fe.json')

// Inizializza Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    'https://encryptedchatapp-cd362-default-rtdb.europe-west1.firebasedatabase.app'
})

admin
  .database()
  .ref()
  .once('value')
  .then(() => {
    console.log('Connesso a Firebase')
  })
  .catch(error => {
    console.error('Connessione a Firebase non riuscita:', error)
  })

// Funzione per eliminare i messaggi dopo un minuto per un utente specifico
const deleteMessagesForUser = async userId => {
  try {
    console.log(`Eliminazione dei messaggi per l'utente ${userId}...`)

    // Ottieni una referenza al percorso dei messaggi dell'utente
    const userRef = admin.database().ref(`avatars/users/${userId}`)

    // Rimuovi il nodo "conversations" per l'utente
    await userRef.child('conversations').remove()

    console.log(`Messaggi rimossi per l'utente ${userId}.`)
  } catch (error) {
    console.error(
      "Errore durante l'eliminazione dei messaggi per l'utente ${userId}:",
      error
    )
  }
}

// Funzione per eliminare i messaggi dopo un minuto per tutti gli utenti
const deleteMessagesForAllUsers = async () => {
  try {
    // Ottieni una referenza al percorso degli utenti
    const usersRef = admin.database().ref('avatars/users')

    // Ottieni una snapshot degli utenti
    const usersSnapshot = await usersRef.once('value')

    // Scansiona tutti gli utenti
    usersSnapshot.forEach(user => {
      const userId = user.key // Ottieni l'userId dall'iterazione sulla snapshot degli utenti
      console.log(`Eliminazione dei messaggi per l'utente ${userId}`)
      deleteMessagesForUser(userId) // Passa l'userId alla funzione per eliminare i messaggi per quell'utente
    })
  } catch (error) {
    console.error("Errore durante l'eliminazione dei messaggi:", error)
  }
}
// Esegui la funzione per eliminare i messaggi una volta al mese (il primo giorno del mese alle ore 00:00)
cron.schedule('0 0 1 * *', () => {
  deleteMessagesForAllUsers()
})

// Endpoint per ottenere il countdown del cron che cancella i messaggi
app.get('/countdown', (req, res) => {
  try {
    // Definisci l'espressione cron per il job
    const cronExpression = '0 0 1 * *' // Esegui una volta al mese, il primo giorno del mese alle 00:00

    // Parsa l'espressione cron
    const interval = parser.parseExpression(cronExpression)

    // Ottieni la prossima esecuzione
    const nextExecution = interval.next()

    // Calcola il tempo rimanente in millisecondi
    const countdown = nextExecution.getTime() - Date.now()

    // Ottieni la data attuale
    const currentDate = new Date()

    // Calcola la data futura aggiungendo il countdown in millisecondi
    const futureDate = new Date(currentDate.getTime() + countdown)

    // Formatta la data futura nel formato desiderato
    const formattedFutureDate = futureDate.toLocaleString()

    // Invia la risposta JSON con il countdown formattato
    res.json({ countdown: formattedFutureDate })
  } catch (error) {
    console.error("Errore nell'ottenere il countdown del cron:", error)
    res
      .status(500)
      .json({ error: "Errore nell'ottenere il countdown del cron" })
  }
})

const PORT = process.env.PORT || 4000 // Assegna un numero di porta

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server avviato: http://localhost:${PORT}`)
})
