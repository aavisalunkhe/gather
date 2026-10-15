require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const Event = require('./models/Event')

const app = express()
const port = process.env.PORT || 5000
if (process.env.CLIENT_URL) app.use(cors({ origin: process.env.CLIENT_URL.split(',').map(value => value.trim()) }))
else if (process.env.NODE_ENV !== 'production') app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.get('/api/events', async (_req, res) => {
  try { res.json(await Event.find().sort({ date: 1 }).limit(100)) }
  catch (error) { res.status(500).json({ message: 'Could not load events.' }) }
})
app.get('/api/events/:id', async (req, res) => {
  try { const event = await Event.findById(req.params.id); if (!event) return res.status(404).json({ message: 'Event not found.' }); res.json(event) }
  catch (error) { res.status(400).json({ message: 'Invalid event ID.' }) }
})
app.post('/api/events', async (req, res) => {
  try {
    const { title, category, date, location, host } = req.body
    if (!title || !category || !date || !location || !host) return res.status(400).json({ message: 'Please fill in the event name, category, date, place, and host.' })
    const event = await Event.create(req.body)
    res.status(201).json(event)
  } catch (error) { res.status(400).json({ message: error.name === 'ValidationError' ? error.message : 'Could not publish this event.' }) }
})
app.post('/api/events/:id/rsvp', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  if (!email || email.length > 254) return res.status(400).json({ message: 'A valid email is required.' })
  try {
    const event = await Event.findById(req.params.id).select('+rsvps')
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    if (!event.rsvps.includes(email)) {
      if (event.rsvps.length >= event.capacity) return res.status(409).json({ message: 'This gathering is full.' })
      event.rsvps.push(email); event.attendees = event.rsvps.length; await event.save()
    }
    res.json(await Event.findById(event._id))
  } catch (error) { res.status(400).json({ message: 'Could not save your spot.' }) }
})
app.use('/api', (_req, res) => res.status(404).json({ message: 'That route does not exist.' }))
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.resolve(__dirname, '../../client/dist')
  app.use(express.static(clientBuild))
  app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')))
} else {
  app.use((_req, res) => res.status(404).json({ message: 'That route does not exist.' }))
}

async function start() {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is required. Copy server/.env.example to server/.env and add your database URL.'); process.exit(1) }
  await mongoose.connect(process.env.MONGODB_URI)
  const count = await Event.estimatedDocumentCount()
  if (!count) {
    await Event.insertMany([
      { title:'Sunday in the garden',category:'Outdoors',date:new Date('2026-10-18T09:00:00+05:30'),endTime:'12:00 PM',location:'Cubbon Park, Bengaluru',host:'Slow Sunday Club',price:0,capacity:36,attendees:28,image:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=85',description:'A long, easy morning in the park. Bring a book, something to sit on, and absolutely no plans afterwards.' },
      { title:'The little pasta class',category:'Food & drink',date:new Date('2026-10-19T18:30:00+05:30'),endTime:'9:00 PM',location:'The Flour Room, Indiranagar',host:'Nina & Co.',price:850,capacity:14,attendees:11,image:'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1000&q=85',description:'Fold fresh pasta by hand, share a table with new friends, and go home with flour on your sleeves.' },
      { title:'A listening room for records',category:'Music',date:new Date('2026-10-21T19:00:00+05:30'),endTime:'10:30 PM',location:'Namma Listening Bar, Koramangala',host:'Side B Society',price:300,capacity:42,attendees:37,image:'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85',description:'One room, one stack of records, no phones on the dance floor. This week: soft disco and a little soul.' },
      { title:'Clay, coffee & company',category:'Make something',date:new Date('2026-10-24T10:30:00+05:30'),endTime:'1:00 PM',location:'Little Clay House, Jayanagar',host:'Studio Sunday',price:600,capacity:18,attendees:14,image:'https://images.unsplash.com/photo-1565193298595-6d2a4f4c1094?auto=format&fit=crop&w=1000&q=85',description:'A beginner-friendly morning with clay, coffee, and a very forgiving teacher. Make something wonky and take it home.' },
      { title:'Books on the rooftop',category:'Community',date:new Date('2026-10-25T16:00:00+05:30'),endTime:'6:00 PM',location:'Terrace at Paper House, MG Road',host:'Paperback People',price:0,capacity:32,attendees:20,image:'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=85',description:'Bring a book you love and leave with a book someone else loves. Tea and very passionate recommendations included.' },
      { title:'The neighbourhood supper',category:'Food & drink',date:new Date('2026-10-27T19:30:00+05:30'),endTime:'10:00 PM',location:'Aster House, Richmond Town',host:'Table for More',price:1200,capacity:20,attendees:16,image:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=85',description:'A seat at a long table, a seasonal menu, and the pleasure of eating with people you haven’t met yet.' },
    ])
  }
  app.listen(port, () => console.log(`Gather API listening on port ${port}`))
}
start().catch(error => { console.error('Could not connect to MongoDB:', error.message); process.exit(1) })
