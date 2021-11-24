const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
   
  const result = { name: 'Bob Dylan', interests: 'Music' }
  return res.render('home.ejs',result);
})

router.get('/add/:name', async (req, res) => {
  const { name } = req.params.name

  return res.send({ result: 'Stored in the DB.' })
})

router.get('/delete/:name', async (req, res) => {
  const { name } = req.params.name
  return res.send({ result: 'Profile Deleted' })
})

module.exports = router