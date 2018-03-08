const axios = require('axios')
const cheerio = require('cheerio')
const match = require('match-sorter')

const SEARCH_URI = 'https://myanimelist.net/search/prefix.json'

const getFromBorder = ($, t) => {
  return $(`span:contains("${t}")`).parent().text().trim().split(' ').slice(1).join(' ').split('\n')[0].trim()
}

const parseCharacterOrStaff = (tr, isStaff = false) => {

  var img = tr.find('img').attr('data-srcset');

  if (img && img.includes(' '))
      img = img.substr(0, img.indexOf(' '))

  return JSON.parse(JSON.stringify({
    link: tr.find('td:nth-child(1)').find('a').attr('href'),
    name: tr.find('td:nth-child(2)').text().trim().split('\n')[0],
    role: tr.find('td:nth-child(2)').text().trim().split('\n')[2].trim(),
    thumbnail: img,
    seiyuu: !isStaff ? {
      link: tr.find('td:nth-child(3)').find('a').attr('href'),
      name: tr.find('td:nth-child(3)').find('a').text().trim()
    } : undefined
  }))
}

const getSimilar = ($) => {
  var similar = []
  $('#anime_recommendation .anime-slide .btn-anime').each(function() {
    var link = $(this).find('.link')
    if (link && link.length) {
      var link = link.attr('href')
      if (link && link.includes('/')) {
        var parts = link.split('/')
        if (parts && parts.length) {
          var idParts = parts[parts.length-1]
          if (idParts && idParts.includes('-')) {
            idParts = idParts.split('-')
            if (idParts && idParts.length == 2) {
                similar.push(parseInt(idParts[0] == 1735 ? idParts[1] : idParts[0]))
            }
          }
        }
      }
    }
  })
  return similar
}

const getReviews = ($) => {
  var reviews = []
  $('.borderDark').each(function() {
    var rvw = $(this).find('.textReadability')
    var continueRvw = rvw.find('span')
    continueRvw.find('div').remove()
    continueRvw = continueRvw.text()
    rvw.find('span').remove()
    rvw.find('table').remove()
    rvw.find('a').remove()
    rvw = rvw.text().trim()

    var topPart = $(this).find('.spaceit').first()

    var topLeft = $(topPart.children('div')[1]).find('a').first()

    var thumbnail = topLeft.find('img').attr('data-src')

    if (!topLeft.length) return

    var name = topLeft.attr('href')
    name = name.substr(name.indexOf('/profile/')).replace('/profile/','')

    var topRight = $(topPart.children('div')[0])

    var rating = $(topRight.children('div')[2])
    rating.find('a').remove()
    rating = parseInt(rating.text().replace(':','').trim())

    reviews.push({
      name, thumbnail, rating, review: rvw, continue: continueRvw
    })
  })
  return reviews
}

const getCharactersAndStaff = ($) => {
  const results = {
    characters: [],
    staff: []
  }

  // Characters
  const leftC = $('div.detail-characters-list').first().find('div.left-column')
  const rightC = $('div.detail-characters-list').first().find('div.left-right')

  const nbLeftC = leftC.children('table').length
  const nbRightC = rightC.children('table').length

  // Staff
  const leftS = $('div.detail-characters-list').last().find('div.left-column')
  const rightS = $('div.detail-characters-list').last().find('div.left-right')

  const nbLeftS = leftS.children('table').length
  const nbRightS = rightS.children('table').length

  // Characters
  for (let i = 1; i <= nbLeftC; ++i) {
    results.characters.push(parseCharacterOrStaff(leftC.find(`table:nth-child(${i}) > tbody > tr`)))
  }

  for (let i = 1; i <= nbRightC; ++i) {
    results.characters.push(parseCharacterOrStaff(rightC.find(`table:nth-child(${i}) > tbody > tr`)))
  }

  // Staff
  for (let i = 1; i <= nbLeftS; ++i) {
    results.staff.push(parseCharacterOrStaff(leftS.find(`table:nth-child(${i}) > tbody > tr`), true))
  }

  for (let i = 1; i <= nbRightS; ++i) {
    results.staff.push(parseCharacterOrStaff(rightS.find(`table:nth-child(${i}) > tbody > tr`), true))
  }

  return results
}

const parsePage = (data, malId) => {
  const $ = cheerio.load(data)
  const result = {}

  result.title = $('span[itemprop="name"]').first().text()
  result.synopsis = $('.js-scrollfix-bottom-rel span[itemprop="description"]').text()
  result.picture = $('img.ac').attr('src')

  const staffAndCharacters = getCharactersAndStaff($)
  result.characters = staffAndCharacters.characters
  result.staff = staffAndCharacters.staff

  result.reviews = getReviews($)

  result.similar = malId ? getSimilar($, malId) : []

  result.trailer = $('a.iframe.js-fancybox-video.video-unit.promotion').attr('href')

  // Parsing left border.
  result.englishTitle = getFromBorder($, 'English:')
  result.japaneseTitle = getFromBorder($, 'Japanese:')
  result.synonyms = getFromBorder($, 'Synonyms:')
  result.type = getFromBorder($, 'Type:')
  result.episodes = getFromBorder($, 'Episodes:')
  result.status = getFromBorder($, 'Status:')
  result.aired = getFromBorder($, 'Aired:')
  result.premiered = getFromBorder($, 'Premiered:')
  result.broadcast = getFromBorder($, 'Broadcast:')
  result.producers = getFromBorder($, 'Producers:').split(',       ')
  result.studios = getFromBorder($, 'Studios:').split(',       ')
  result.source = getFromBorder($, 'Source:')
  result.genres = getFromBorder($, 'Genres:').split(', ')
  result.duration = getFromBorder($, 'Duration:')
  result.rating = getFromBorder($, 'Rating:')
  result.score = getFromBorder($, 'Score:').split(' ')[0].slice(0, -1)
  result.scoreStats = getFromBorder($, 'Score:').split(' ').slice(1).join(' ').slice(1, -1)
  result.ranked = getFromBorder($, 'Ranked:').slice(0, -1)
  result.popularity = getFromBorder($, 'Popularity:')
  result.members = getFromBorder($, 'Members:')
  result.favorites = getFromBorder($, 'Favorites:')

  return result
}

const getInfoFromURL = (url, malId) => {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !url.toLocaleLowerCase().includes('myanimelist')) {
      reject(new Error('[Mal-Scraper]: Invalid Url.'))
    }

    axios.get(url)
      .then(({data}) => {
        const res = parsePage(data, malId)
        res.id = +url.split('/').splice(-2, 1)[0]
        resolve(res)
      })
      .catch(/* istanbul ignore next */(err) => reject(err))
  })
}

const getResultsFromSearch = (keyword) => {
  return new Promise((resolve, reject) => {
    if (!keyword) reject(new Error('[Mal-Scraper]: Received no keyword to search.'))

    axios.get(SEARCH_URI, {
      params: {
        type: 'anime',
        keyword
      }
    }).then(({data}) => {
      const items = []

      data.categories.forEach((elem) => {
        elem.items.forEach((item) => {
          items.push(item)
        })
      })

      resolve(items)
    }).catch(/* istanbul ignore next */(err) => {
      reject(err)
    })
  })
}

const getBestMatch = (name, items) => {
  return match(items, name, {keys: ['name']})[0]
}

const getInfoFromName = (name) => {
  return new Promise((resolve, reject) => {
    if (!name || typeof name !== 'string') {
      reject(new Error('[Mal-Scraper]: Invalid name.'))
    }

    getResultsFromSearch(name)
      .then(async (items) => {
        try {
          const bestMacth = getBestMatch(name, items)
          const url = bestMacth ? bestMacth.url : items[0].url
          const data = await getInfoFromURL(url)

          data.url = url

          resolve(data)
        } catch (e) {
          /* istanbul ignore next */
          reject(e)
        }
      })
      .catch(/* istanbul ignore next */(err) => reject(err))
  })
}

module.exports = {
  getInfoFromURL,
  getResultsFromSearch,
  getInfoFromName
}
