#!/usr/bin/env node

import 'dotenv/config'

const enFaqs = [
  {
    question: 'What is Algomart?',
    answer: `<p>Algomart is where collectors to come together to purchase and sell verified digital collectibles on the Algomart blockchain. </p>`,
  },
  {
    question: 'What is an NFT?',
    answer: `<p>NFT stands for "non-fungible token." At a basic level, an NFT is a digital asset that links ownership to unique physical or digital items, such as works of art, real estate, music, or videos</p>`,
  },
  {
    question: 'What is a verified digital collectible?',
    answer: `<p>A verified digital collectible is a one-of-kind asset with unique ownership authenticated by the blockchain. Typically, a verified digital collectible can be purchased and on a marketplace. Digital collectibles can take many shapes, and every one is verifiably unique with blockchain data. </p>`,
  },
  {
    question: 'What is a digital collection?',
    answer: `<p>A digital collection is a grouping of verified digital assets, organized by series and, occasionally, in themed sets. As you acquire new digital collectibles you will create your very own collection, found in My Collectibles, with the ability to show off, add to, and refine your collection over time.</p>`,
  },
  {
    question: 'What is “My wallet”?',
    answer: `<p>“My wallet” is your own safe, secure online manager where you keep your funds and account for all of your favorite verified digital collectibles. Every transaction you make in the Algorand marketplace - whether buying or selling - will be processed via “my wallet”.</p>`,
  },
  {
    question: 'What is a blockchain?',
    answer: `<p>A blockchain is a type of digital database that allows online transactions to occur in a transparent, secure, and decentralised way. Due to its decentralised nature,  it’s easier, and often more cost-effective, to make transactions and move your digital assets. Many new digital products and services are being built on blockchains by both established and emerging organizations because of the speed, security, and ease of the transaction process.</p>`,
  },
  {
    question: 'What is Algorand?',
    answer: `
      <p>Algorand is the world's first carbon-negative blockchain, meaning it operates without significant impact to the environment. It was designed by MIT professor and Turing Award-winning cryptographer Silvio Micali. It is currently the technology of choice for over 2,000 global organizations, governments, and decentralized applications.</p>
      <p>Algorand aims to create a world where everyone creates and exchanges value efficiently, transparently, and securely. You can learn more about Algorand at <a href="https://algorand.com" target="_blank">www.algorand.com</a>.</p>
    `,
  },
]

export async function seedFAQs(directus, homepage) {
  console.log('- FAQs')
  try {
    const faqs = enFaqs.map(({ question, answer }, index) => {
      return {
        key: question
          .trim()
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, ''),
        sort: index + 1,
        status: 'published',
        translations: [{ languages_code: 'en-UK', question, answer }],
        homepage: homepage?.id && index < 5 ? homepage.id : null, // assign first 5 to homepage if homepage passed
      }
    })
    await directus.items('frequently_asked_questions').createMany(faqs)
  } catch (err) {
    console.log('Seed FAQs Error: ' + err)
  }
}
