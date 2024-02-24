// notifications.js
const Express = require('express')
const admin = require('firebase-admin')

const router = Express.Router() // Crea un'istanza di Express

const tokens = [] // Array di token

// API di registrazione token FCM:
// Questa API prenderà il token FCM di un utente e lo inserirà nell'array dei token.
// A breve esamineremo come recuperare i token FCM da un'applicazione React Native.
// Idealmente i token verrebbero salvati in un database anziché in un array, al momento li mettiamo in un array
router.post('/register', (req, res) => {
  const { token } = req.body

  tokens.push(token)
  res.status(200).json({ message: 'Successfully registered FCM Token!' })
})

router.get('/listAll', (req, res) => {
  res.json(tokens)
})

// API di notifiche:
// Questa API accetta 3 parametri, titolo, corpo messaggio, imageUrl e invia la notifica push
// contenente questi parametri ai dispositivi associati all'array di token che abbiamo precedentemente registrato.
// Utilizzeremo la funzione admin.messaging().sendMulticast() per inviare la notifica a più dispositivi.
router.post('/notification', async (req, res) => {
  try {
    const { title, body, imageUrl, token, androidData } = req.body
    await admin.messaging().send({
      token: token,
      notification: {
        title: title,
        body: body,
        imageUrl: imageUrl
      },
      android: {
        notification: {
          imageUrl: imageUrl
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      },
      data: androidData
    })

    res.status(200).json({ message: 'Successfully sent notifications!' })
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Something went wrong!' })
  }
})

module.exports = router
