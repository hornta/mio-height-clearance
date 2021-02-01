import axios from 'axios'
import fs from 'fs';

const path = 'https://www.mio.se/api/v1.0/products/search?filter=q%3D*%26offset%3D0%26path%3Dsoffor-och-fatoljer%252Fsoffor%26size%3D10000';
(async() => {
  const articleIdsFile = './articleIds.json'

  const articleIds = new Set();
  if(!fs.existsSync(articleIdsFile)) {
    const { data } = await axios.get(path);
    const documents = data?.searchResults?.documents ?? [];
    for(const doc of documents) {
      const matchingArticles = doc?.fields?.matchingArticles ?? [];
      for(const article of matchingArticles) {
        articleIds.add(article.articleId);
      }
    }
    fs.writeFileSync(articleIdsFile, JSON.stringify([...articleIds], null, 2), { encoding: 'utf8' });
  } else {
    const data = fs.readFileSync(articleIdsFile, { encoding: 'utf8' })
    for(const articleId of JSON.parse(data)) {
      articleIds.add(articleId);
    }
  }

  const resultsFile = './articleResults.json'
  let results = {}
  if(fs.existsSync(resultsFile)) {
    const data = fs.readFileSync(resultsFile, { encoding: 'utf8' });
    results = JSON.parse(data);
  }
  let modified = false;
  for(const articleId of articleIds) {
    if(results[articleId]) {
      continue;
    }
    console.log('fetching article: ' + articleId)
    const { data } = await axios.get(`https://www.mio.se/api/v1.0/articles/${articleId}`)
    const documents = data?.searchResults?.documents ?? [];
    if(documents.length !== 1) {
      console.error('expected one document for ' + articleId);
    } else {
      const articleInformation = documents?.[0]?.fields?.articleInformation;
      results[articleId] = articleInformation;
      modified = true;
    }
  }
  if(modified) {
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), { encoding: 'utf8' });
  }

  let groupedArticles = {};

  for(const articleInfo of Object.values(results)) {
    groupedArticles[articleInfo.clearanceUnderFurniture] = groupedArticles[articleInfo.clearanceUnderFurniture] || []
    groupedArticles[articleInfo.clearanceUnderFurniture].push(articleInfo)
  }

  console.log(Object.keys((groupedArticles)));
  // console.log(groupedArticles[18])
})()