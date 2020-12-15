const router = require('express').Router()
const Card = require('../../models/Card')

// Subsequent fetches: update db & return next 10 random cards
router.post('/', async (req, res) => {
  try {
    await updateDB(req.body)
    res
      .status(200)
      .json(
        (await getNext10RandomCards()).map(({ question }) => ({ question }))
      )
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

const getNext10RandomCards = async () => {
  // Cards can be unanswered or answered
  const cards = await Card.find()
  const answeredCards = cards.filter((card) => card.responses.length !== 0)
  const unansweredCards = cards.filter((card) => card.responses.length === 0)

  const { noOfAnsweredToShow, noOfUnansweredToShow } = await getCardsToShow(
    answeredCards,
    unansweredCards
  )
  console.log({ noOfAnsweredToShow, noOfUnansweredToShow })
  return (await getAnsweredCards(answeredCards, noOfAnsweredToShow)).concat(
    getRandomCards(unansweredCards, noOfUnansweredToShow)
  )
}

const getCardsToShow = async (answeredCards, unansweredCards) => {
  let allResponses = []
  answeredCards.forEach((card) => {
    allResponses = allResponses.concat(card.responses)
  })
  const totalCorrect = allResponses.reduce(
    (accum, item) => accum + (item ? 1 : 0),
    0
  )
  const totalIncorrect = allResponses.reduce(
    (accum, item) => accum + (!item ? 1 : 0),
    0
  )
  console.log({ totalCorrect, totalIncorrect })
  console.log({ outOf10: (totalIncorrect / allResponses.length) * 10 })
  const noOfAnsweredToShow = Math.max(
    Math.floor((totalIncorrect / allResponses.length) * 10) - 4,
    0
  )
  if (unansweredCards.length < 10 - noOfAnsweredToShow) {
    return {
      noOfAnsweredToShow: 10 - unansweredCards.length,
      noOfUnansweredToShow: unansweredCards.length
    }
  }
  return { noOfAnsweredToShow, noOfUnansweredToShow: 10 - noOfAnsweredToShow }
}

const getAnsweredCards = async (answeredCards, noOfAnsweredToShow) => {
  // Answered cards comprise of learning cards and mastered cards
  const learningCards = answeredCards.filter((card) =>
    card.responses.includes(0)
  )
  const masteredCards = answeredCards.filter(
    (card) => !card.responses.includes(0)
  )
  if (learningCards.length < noOfAnsweredToShow) {
    return learningCards.concat(
      getRandomCards(masteredCards, noOfAnsweredToShow - learningCards.length)
    )
  }
  return getRandomCards(learningCards, noOfAnsweredToShow)
}

const updateDB = async (answeredCards) => {
  console.log({ answeredCards })
  for (const { question, response } of answeredCards) {
    const card = await Card.findOne({ question })
    // console.log('before', { card })
    card.responses.push(response)
    // Track upto a maximum of 3 responses
    if (card.responses.length > 3) card.responses.shift()
    await Card.findOneAndUpdate({ question }, card)
  }
}

// First fetch: init db & return 10 random cards
router.get('/', async (req, res) => {
  try {
    // Delete All documents
    await Card.deleteMany({})
    // Insert 100 documents to db
    await Card.create(
      [...Array(100).keys()].map((item) => ({ question: item, responses: [] }))
    )
    // Fetch 100 documents from db
    const cards = await Card.find().select('-__v -_id -responses')
    // Send 10 random cards
    res.status(200).json(getRandomCards(cards, 10))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

const getRandomCards = (masteredCards, noOfMasteredToShow) =>
  getShuffledArray(masteredCards).slice(0, noOfMasteredToShow)

function getShuffledArray (array) {
  const shuffledArray = [...array]
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]
  }
  return shuffledArray
}

module.exports = router
