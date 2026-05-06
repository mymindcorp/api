# Entities (Coming soon)

Entities are typed, structured records that describe what an object _is_: the book inside a book cover photo, the product behind a shopping URL, the place tagged in a screenshot. Each object has a primary entity accessible via `object.entity`, and entities can be fetched directly by ID.

**Work in progress**

This page documents the entity model under active development. Type identifiers, property shapes, and the `GET /entities/:id` endpoint may all change before launch — don't ship integrations against this surface yet.

## The entity model

| Property | Type | Description |
|----------|------|-------------|
| id | [Uid](types.md#uid) | Unique identifier for the entity. |
| type | string | Type name for this entity. See [Type Identifiers](#type-identifiers) below. |

### Type identifiers

[Apartment](#apartment), [Article](#article), [AudioObject](#audioobject), [BlueSkyPost](#blueskypost), [Book](#book), [Brand](#brand), [Business](#business), [Document](#document), [FacebookReel](#facebookreel), [Flight](#flight), [FlightReservation](#flightreservation), [House](#house), [Human](#human), [ImageObject](#imageobject), [InstagramPost](#instagrampost), [InstagramReel](#instagramreel), [Media](#media), [Model](#model), [Movie](#movie), [MusicAlbum](#musicalbum), [MusicPlaylist](#musicplaylist), [MusicRecording](#musicrecording), [MusicRelease](#musicrelease), [MusicVideo](#musicvideo), [Note](#note), [Painting](#painting), [Palette](#palette), [Periodical](#periodical), [Photograph](#photograph), [Place](#place), [Podcast](#podcast), [PodcastEpisode](#podcastepisode), [PodcastSeason](#podcastseason), [Product](#product), [Quotation](#quotation), [RealEstateListing](#realestatelisting), [Recipe](#recipe), [RedditPost](#redditpost), [Repository](#repository), [RepositoryIssue](#repositoryissue), [Restaurant](#restaurant), [ScholarlyArticle](#scholarlyarticle), [Screenshot](#screenshot), [SoftwareApplication](#softwareapplication), [SubstackNote](#substacknote), [TedTalk](#tedtalk), [ThreadsPost](#threadspost), [TikTokPost](#tiktokpost), [TVEpisode](#tvepisode), [TVSeason](#tvseason), [TVSeries](#tvseries), [Typeface](#typeface), [VideoGame](#videogame), [VideoObject](#videoobject), [VimeoVideo](#vimeovideo), [WebPage](#webpage), [WikipediaArticle](#wikipediaarticle), [XPost](#xpost), [YouTubeVideo](#youtubevideo)

## Extended properties

Each entity type adds its own properties on top of the base model. The sections below document type-specific fields. Shared sub-types referenced by multiple entities (Actor, Address, Brand, etc.) are listed together at the end.

### Apartment

| Property | Type | Description |
|----------|------|-------------|
| offers | [Offer](types.md#offer)[] | Available offers. |
| address | [Address](#address) | Street address. |
| url | Url | Listing URL. |

### Article

| Property | Type | Description |
|----------|------|-------------|
| title | string | Article headline. |
| author | [Actor](#actor) | The author. |
| published | Timestamp | When the article was published. |
| publisher | [Actor](#actor) | The publisher. |
| content | [Content](types.md#content) | The content body. |
| url | Url | Article URL. |

### AudioObject

| Property | Type | Description |
|----------|------|-------------|
| title | string | Audio title. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Audio URL. |

### BlueSkyPost

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| content | [Content](types.md#content) | The content body. |
| url | Url | Post URL. |

### Book

| Property | Type | Description |
|----------|------|-------------|
| title | string | Book title. |
| authors | [Actor](#actor)[] | The authors. |
| isbn | [ISBN](types.md#isbn) | ISBN-13 identifier. |
| publisher | [Actor](#actor) | The publisher. |
| published | Timestamp | Publication date. |
| offers | [Offer](types.md#offer)[] | Available offers. |
| url | Url | Book URL. |

### Business

| Property | Type | Description |
|----------|------|-------------|
| name | string | Business name. |
| address | [Address](#address) | Street address. |
| phoneNumber | string | Phone number. |
| url | Url | Website URL. |

### Document

| Property | Type | Description |
|----------|------|-------------|
| title | string | Document title. |
| format | string | File format, e.g. `pdf`, `docx`. |
| url | Url | Document URL. |

### FacebookReel

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| url | Url | Reel URL. |

### Flight (Coming soon)

| Property | Type | Description |
|----------|------|-------------|
| airline | [Airline](#airline) | The airline. |
| flightNumber | string | Flight number. |
| departure | [Airport](#airport) | Departure airport. |
| arrival | [Airport](#airport) | Arrival airport. |
| departureTime | Timestamp | Scheduled departure time. |
| arrivalTime | Timestamp | Scheduled arrival time. |

### FlightReservation (Coming soon)

| Property | Type | Description |
|----------|------|-------------|
| confirmationNumber | string | Booking confirmation code. |
| flight | [EntityReference](types.md#entityreference) | Reference to the flight entity. |

### House

| Property | Type | Description |
|----------|------|-------------|
| name | string | Listing title. |
| offers | [Offer](types.md#offer)[] | Available offers. |
| address | [Address](#address) | Street address. |
| bedrooms | integer | Number of bedrooms. |
| bathrooms | integer | Number of bathrooms. |
| url | Url | Listing URL. |

### Human (Coming soon)

| Property | Type | Description |
|----------|------|-------------|
| name | string | Full name. |
| url | Url | Profile or homepage URL. |

### ImageObject

| Property | Type | Description |
|----------|------|-------------|
| width | integer | Width in pixels. |
| height | integer | Height in pixels. |
| format | string | Image format, e.g. `jpeg`, `png`, `webp`. |
| url | Url | Image URL. |

### InstagramPost

| Property | Type | Description |
|----------|------|-------------|
| poster | [Actor](#actor) | The poster. |
| content | [Content](types.md#content) | The content body. |
| url | Url | Post URL. |

### InstagramReel

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| url | Url | Reel URL. |

### Media

| Property | Type | Description |
|----------|------|-------------|
| format | string | Media format or MIME type. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Media URL. |

### Model

| Property | Type | Description |
|----------|------|-------------|
| title | string | Model title. |
| format | string | 3D format, e.g. `glb`, `obj`, `usdz`. |
| url | Url | Model URL. |

### Movie

| Property | Type | Description |
|----------|------|-------------|
| title | string | Movie title. |
| directors | [Actor](#actor)[] | The directors. |
| published | Timestamp | Release date. |
| duration | [Duration](types.md#duration) | Duration. |

### MusicAlbum

| Property | Type | Description |
|----------|------|-------------|
| title | string | Album title. |
| artist | [Actor](#actor) | The artist. |
| year | integer | Release year. |
| tracks | [Track](#track)[] | Album tracks. |

#### Track

| Property | Type | Description |
|----------|------|-------------|
| title | string | Track title. |
| number | integer | Track number. |
| duration | [Duration](types.md#duration) | Duration. |

### MusicPlaylist

| Property | Type | Description |
|----------|------|-------------|
| title | string | Playlist title. |
| tracks | [Track](#track)[] | Playlist tracks. |
| url | Url | Playlist URL. |

### MusicRecording

| Property | Type | Description |
|----------|------|-------------|
| title | string | Track title. |
| artist | [Actor](#actor) | The artist. |
| album | [EntityReference](types.md#entityreference) | Reference to the parent album entity. |
| duration | [Duration](types.md#duration) | Duration. |

### MusicVideo

| Property | Type | Description |
|----------|------|-------------|
| title | string | Video title. |
| artist | [Actor](#actor) | The artist. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Video URL. |

### MusicRelease

| Property | Type | Description |
|----------|------|-------------|
| title | string | Release title. |
| artist | [Actor](#actor) | The artist. |
| kind | string | Release type, e.g. `Single`, `Album`, `EP`. |
| year | integer | Release year. |
| url? | Url | Release URL. |

### Note

| Property | Type | Description |
|----------|------|-------------|
| content | [Content](types.md#content) | The content body. |

### Painting

| Property | Type | Description |
|----------|------|-------------|
| title | string | Painting title. |
| artist | [Actor](#actor) | The artist. |
| published | Timestamp | When the painting was created. |
| medium | string | Medium, e.g. `oil on canvas`. |

### Palette

| Property | Type | Description |
|----------|------|-------------|
| colors | [Color](types.md#color)[] | Palette colors. |

### Periodical

| Property | Type | Description |
|----------|------|-------------|
| name | string | Publication name. |
| url | Url | Publication URL. |

### Photograph

| Property | Type | Description |
|----------|------|-------------|
| title | string | Photograph title. |
| author | [Actor](#actor) | The author. |
| url | Url | Image URL. |

### Place

| Property | Type | Description |
|----------|------|-------------|
| name | string | Place name. |
| address | [Address](#address) | Street address. |

### Podcast

| Property | Type | Description |
|----------|------|-------------|
| title | string | Podcast title. |
| author | [Actor](#actor) | The author. |
| url | Url | Podcast URL. |

### PodcastEpisode

| Property | Type | Description |
|----------|------|-------------|
| title | string | Episode title. |
| podcast | [EntityReference](types.md#entityreference) | Reference to the parent podcast entity. |
| duration | [Duration](types.md#duration) | Duration. |
| published | Timestamp | Publication date. |
| url | Url | Episode URL. |

### PodcastSeason

| Property | Type | Description |
|----------|------|-------------|
| title | string | Season title. |
| podcast | [EntityReference](types.md#entityreference) | Reference to the parent podcast entity. |
| number | integer | Season number. |

### Product

| Property | Type | Description |
|----------|------|-------------|
| name | string | Product name. |
| offers | [Offer](types.md#offer)[] | Available offers. |
| brand | [Brand](#brand) | The brand. |
| url | Url | Product URL. |

### Quotation

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| content | [Content](types.md#content) | The content body. |

### RealEstateListing

| Property | Type | Description |
|----------|------|-------------|
| name | string | Listing title. |
| offers | [Offer](types.md#offer)[] | Available offers. |
| address | [Address](#address) | Street address. |
| property | [EntityReference](types.md#entityreference) | Reference to the property entity (Apartment, House, etc.). |
| url | Url | Listing URL. |

### Recipe

| Property | Type | Description |
|----------|------|-------------|
| title | string | Recipe title. |
| author | [Actor](#actor) | The author. |
| ingredients | [RecipeIngredient](#recipeingredient)[] | List of ingredients. |
| instructions | [RecipeInstruction](#recipeinstruction)[] | Step-by-step instructions. |
| cookTime | [Duration](types.md#duration) | Cook time. |
| prepTime | [Duration](types.md#duration) | Prep time. |
| url | Url | Recipe URL. |

#### RecipeIngredient

| Property | Type | Description |
|----------|------|-------------|
| id | [Uid](types.md#uid) | Ingredient identifier. |
| name | string | Ingredient name. |
| quantity | number | Amount required. |

#### RecipeInstruction

| Property | Type | Description |
|----------|------|-------------|
| text | string | The instruction text. |

### RedditPost

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| subreddit | string | Subreddit name. |
| published | Timestamp | Publication date. |
| url | Url | Post URL. |

### Repository

| Property | Type | Description |
|----------|------|-------------|
| license | [License](#license) | Repository license. |
| owner | [Actor](#actor) | Repository owner. |
| url | Url | Repository URL. |

### RepositoryIssue

| Property | Type | Description |
|----------|------|-------------|
| title | string | Issue title. |
| number | integer | Issue number. |
| state | string | Issue state, e.g. `open`, `closed`. |
| author | [Actor](#actor) | The author. |
| repository | [EntityReference](types.md#entityreference) | Reference to the parent repository entity. |
| url | Url | Issue URL. |

### Restaurant

| Property | Type | Description |
|----------|------|-------------|
| name | string | Restaurant name. |
| address | [Address](#address) | Street address. |
| phoneNumber | string | Phone number. |
| url | Url | Website URL. |

### ScholarlyArticle

| Property | Type | Description |
|----------|------|-------------|
| title | string | Paper title. |
| author | [Actor](#actor) | The author. |
| published | Timestamp | Publication date. |
| journal | [Actor](#actor) | The journal. |
| doi | string | DOI identifier. |
| url | Url | Paper URL. |

### Screenshot (Coming soon)

| Property | Type | Description |
|----------|------|-------------|
| width | integer | Width in pixels. |
| height | integer | Height in pixels. |
| url | Url | Image URL. |

### SoftwareApplication

| Property | Type | Description |
|----------|------|-------------|
| name | string | Application name. |
| platform | [Platform](#platform) | The platform. |
| url | Url | Application URL. |

### SubstackNote

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| published | Timestamp | Publication date. |
| url | Url | Note URL. |

### TedTalk

| Property | Type | Description |
|----------|------|-------------|
| title | string | Talk title. |
| speaker | [Actor](#actor) | The speaker. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Talk URL. |

### ThreadsPost

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| content | [Content](types.md#content) | The content body. |
| url | Url | Post URL. |

### TikTokPost

| Property | Type | Description |
|----------|------|-------------|
| poster | [Actor](#actor) | The poster. |
| url | Url | Video URL. |

### TVEpisode

| Property | Type | Description |
|----------|------|-------------|
| title | string | Episode title. |
| series | [EntityReference](types.md#entityreference) | Reference to the parent TV series entity. |
| season | [TVEpisodeSeason](#tvepisodeseason) | The season this episode belongs to. |
| number | integer | Episode number. |
| duration | [Duration](types.md#duration) | Duration. |
| url? | Url | Episode URL. |

#### TVEpisodeSeason

| Property | Type | Description |
|----------|------|-------------|
| id | [Uid](types.md#uid) | Identifier of the parent season entity. |
| number | integer | Season number. |

### TVSeason

| Property | Type | Description |
|----------|------|-------------|
| title | string | Season title. |
| series | [EntityReference](types.md#entityreference) | Reference to the parent TV series entity. |
| number | integer | Season number. |
| episodes | [EntityReference](types.md#entityreference)[] | Episodes in the season. |
| url? | Url | Season URL. |

### TVSeries

| Property | Type | Description |
|----------|------|-------------|
| title | string | Series title. |
| seasons | [EntityReference](types.md#entityreference)[] | Seasons in the series. |

### Typeface

| Property | Type | Description |
|----------|------|-------------|
| name | string | Typeface name. |
| foundry | [Actor](#actor) | The type foundry. |
| designer? | [Actor](#actor) | The type designer. |

### VideoGame

| Property | Type | Description |
|----------|------|-------------|
| title | string | Game title. |
| developer | [Actor](#actor) | The developer. |
| publisher | [Actor](#actor) | The publisher. |
| platform | [Platform](#platform) | The platform. |
| published | Timestamp | Release date. |
| url? | Url | Game URL. |

### VideoObject

| Property | Type | Description |
|----------|------|-------------|
| title | string | Video title. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Video URL. |

### VimeoVideo

| Property | Type | Description |
|----------|------|-------------|
| title | string | Video title. |
| author | [Actor](#actor) | The author. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Video URL. |

### WebPage

| Property | Type | Description |
|----------|------|-------------|
| title | string | Page title. |
| site | [Site](#site) | The source site. |
| url | Url | Page URL. |

### WikipediaArticle

| Property | Type | Description |
|----------|------|-------------|
| title | string | Article title. |
| language | string | Wikipedia language code, e.g. `en`. |
| url | Url | Article URL. |

### XPost

| Property | Type | Description |
|----------|------|-------------|
| author | [Actor](#actor) | The author. |
| published | Timestamp | Publication date. |
| content | [Content](types.md#content) | The content body. |
| url | Url | Post URL. |

### YouTubeVideo

| Property | Type | Description |
|----------|------|-------------|
| title | string | Video title. |
| author | [Actor](#actor) | The author. |
| duration | [Duration](types.md#duration) | Duration. |
| url | Url | Video URL. |

## Shared sub-types

These sub-types are referenced by multiple entity types above.

### Actor

| Property | Type | Description |
|----------|------|-------------|
| name | string | Display name — a person, author, publisher, or organization. |

### Address

| Property | Type | Description |
|----------|------|-------------|
| street | string | Street address. |
| city | string | City name. |
| region | string | State, province, or region. |
| postalCode | string | Postal or ZIP code. |
| country | [Country](#country) | Country. |

### Airline

| Property | Type | Description |
|----------|------|-------------|
| name | string | Airline name. |
| iata | string | IATA airline code, e.g. `AA`, `UA`. |

### Airport

| Property | Type | Description |
|----------|------|-------------|
| name | string | Airport name. |
| code | string | IATA airport code, e.g. `LAX`, `JFK`. |

### Brand

| Property | Type | Description |
|----------|------|-------------|
| name | string | Brand name. |

### Country

| Property | Type | Description |
|----------|------|-------------|
| name | string | Country name. |
| code | string | [ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html) alpha-2 code, e.g. `US`, `GB`. |

### Language

| Property | Type | Description |
|----------|------|-------------|
| name | string | Language name. |
| code | string | [ISO 639-1](https://www.iso.org/iso-639-language-code) code, e.g. `en`, `fr`. |

### License

| Property | Type | Description |
|----------|------|-------------|
| name | string | Display name of the license. |

### Platform

| Property | Type | Description |
|----------|------|-------------|
| name | string | Platform name. |

### Site

| Property | Type | Description |
|----------|------|-------------|
| name | string | Site name. |
| domain | string | Domain name, e.g. `example.com`. |

## Actions

### Get an entity

Retrieves a single entity by its ID.

```
GET /entities/:id        1 credit
```

### Path parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | [Uid](types.md#uid) | Entity to retrieve. |

Response 200 OK

```json
{
  "id": "c3D4e5F6g7H8i9J0k1L2m3",
  "type": "Brand"
}
```
