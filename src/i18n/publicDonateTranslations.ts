export type PublicLanguage = 'en' | 'ta';

export interface PublicDonateDictionary {
  badgeNoLogin: string;
  pageTitle: string;
  pageSubtitle: string;
  // Shop section
  shopSectionTitle: string;
  shopNameLabel: string;
  shopNamePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneHint: string;
  prefilledBadge: string;
  notYourShop: string;
  // Food section
  foodSectionTitle: string;
  foodTypeLabel: string;
  quantityLabel: string;
  quantityPortions: string;
  storageAutoBadge: string;
  // Time section
  timeSectionTitle: string;
  preparedTimeLabel: string;
  timeJustNow: string;
  time1hAgo: string;
  time2hAgo: string;
  timePick: string;
  deadlineLabel: string;
  deadlinePlus1h: string;
  deadlinePlus2h: string;
  deadlinePlus3h: string;
  deadlinePick: string;
  safeLimitNotice: string;
  capDeadlineBtn: string;
  // Location section
  locationSectionTitle: string;
  locationExplanation: string;
  shareLocationBtn: string;
  sharingLocation: string;
  locationCaptured: string;
  locationDenied: string;
  tryAgainBtn: string;
  fallbackOr: string;
  landmarkLabel: string;
  landmarkPlaceholder: string;
  dropPinLabel: string;
  pinPlaced: string;
  // Submit & Validation
  submitBtn: string;
  submitting: string;
  errShopNameRequired: string;
  errPhoneInvalid: string;
  errLocationRequired: string;
  errRateLimit: string;
  errSpamDetected: string;
  // Confirmation screen
  confirmTitle: string;
  confirmReviewNotice: string;
  confirmShop: string;
  confirmQty: string;
  confirmFoodType: string;
  confirmPrepared: string;
  confirmDeadline: string;
  postAnotherBtn: string;
  ngoLabel: string;
}

export const PUBLIC_DONATE_TRANSLATIONS: Record<PublicLanguage, PublicDonateDictionary> = {
  en: {
    badgeNoLogin: 'No App • No Login • Under 30s',
    pageTitle: 'Quick Food Donation',
    pageSubtitle: 'Connect leftover surplus directly to local NGO collection drivers',
    // Shop section
    shopSectionTitle: '1. Shop Details',
    shopNameLabel: 'Shop / Restaurant Name',
    shopNamePlaceholder: 'e.g. Sri Meenakshi Sweets & Bakers',
    phoneLabel: '10-Digit Mobile Number',
    phonePlaceholder: 'e.g. 9842100001',
    phoneHint: 'Driver will call this number upon arrival',
    prefilledBadge: 'Saved shop on this phone',
    notYourShop: 'Not your shop? Clear',
    // Food section
    foodSectionTitle: '2. Food & Portions',
    foodTypeLabel: 'Food Type',
    quantityLabel: 'Surplus Portions',
    quantityPortions: 'portions',
    storageAutoBadge: 'Storage: {type} (auto-suggested)',
    // Time section
    timeSectionTitle: '3. Freshness & Deadline',
    preparedTimeLabel: 'When was it prepared?',
    timeJustNow: 'Just now',
    time1hAgo: '1 h ago',
    time2hAgo: '2 h ago',
    timePick: 'Custom',
    deadlineLabel: 'Pickup Deadline (Latest safe time)',
    deadlinePlus1h: '+1 h',
    deadlinePlus2h: '+2 h',
    deadlinePlus3h: '+3 h',
    deadlinePick: 'Custom',
    safeLimitNotice: 'Safe window: max {hours}h for {type} from prep time',
    capDeadlineBtn: 'Cap to safe time ({time})',
    // Location section
    locationSectionTitle: '4. Pickup Location',
    locationExplanation: 'We use your location only so the NGO can find your shop for pickup.',
    shareLocationBtn: 'Share my location',
    sharingLocation: 'Locating shop...',
    locationCaptured: 'Location captured (±{acc} m)',
    locationDenied: 'Location permission denied or unavailable.',
    tryAgainBtn: 'Try again',
    fallbackOr: 'Or provide landmark / drop a pin:',
    landmarkLabel: 'Landmark or Address',
    landmarkPlaceholder: 'e.g. Opp. Town Hall, West Veli Street',
    dropPinLabel: 'Tap on map to drop pin',
    pinPlaced: 'Pin dropped on map',
    // Submit & Validation
    submitBtn: 'Donate {count} Portions Now',
    submitting: 'Submitting donation...',
    errShopNameRequired: 'Please enter your shop or business name.',
    errPhoneInvalid: 'Please enter a valid 10-digit Indian mobile number.',
    errLocationRequired: 'Please share your location, enter a landmark, or drop a pin on the map.',
    errRateLimit: 'Limit reached: You have submitted 5 donations in the last hour. Please wait before submitting again.',
    errSpamDetected: 'Submission failed spam verification. Please try again.',
    // Confirmation screen
    confirmTitle: 'Donation Posted!',
    confirmReviewNotice:
      'The NGO will review and confirm pickup. Your food is not marked collected until the NGO confirms.',
    confirmShop: 'Shop',
    confirmQty: 'Quantity',
    confirmFoodType: 'Food type',
    confirmPrepared: 'Prepared at',
    confirmDeadline: 'Pickup deadline',
    postAnotherBtn: 'Post another donation',
    ngoLabel: 'Recipient NGO',
  },
  ta: {
    badgeNoLogin: 'ஆப் தேவையில்லை • லாகின் தேவையில்லை • 30 விநாடிகளில்',
    pageTitle: 'உடனடி உணவு நன்கொடை',
    pageSubtitle: 'மீதமுள்ள உணவை உள்ளூர் தன்னார்வ வாகனங்களுடன் நேரடியாக இணைக்கவும்',
    // Shop section
    shopSectionTitle: '1. கடை விவரங்கள்',
    shopNameLabel: 'கடை / உணவகத்தின் பெயர்',
    shopNamePlaceholder: 'எ.கா. ஸ்ரீ மீனாட்சி ஸ்வீட்ஸ்',
    phoneLabel: '10 இலக்க மொபைல் எண்',
    phonePlaceholder: 'எ.கா. 9842100001',
    phoneHint: 'வாகனம் வரும்போது இந்த எண்ணிற்கு அழைப்பார்கள்',
    prefilledBadge: 'இந்த போனில் சேமிக்கப்பட்ட கடை',
    notYourShop: 'உங்கள் கடை இல்லையா? அழிக்கவும்',
    // Food section
    foodSectionTitle: '2. உணவு மற்றும் அளவு',
    foodTypeLabel: 'உணவு வகை',
    quantityLabel: 'உபரி உணவின் அளவு',
    quantityPortions: 'உணவுகள்',
    storageAutoBadge: 'சேமிப்பு: {type} (தானாகத் தேர்வு செய்யப்பட்டது)',
    // Time section
    timeSectionTitle: '3. பாதுகாப்பு நேரம் மற்றும் காலக்கெடு',
    preparedTimeLabel: 'எப்போது தயாரிக்கப்பட்டது?',
    timeJustNow: 'இப்போதுதான்',
    time1hAgo: '1 மணி முன்',
    time2hAgo: '2 மணி முன்',
    timePick: 'நேரம்',
    deadlineLabel: 'கடைசி பிக்கப் நேரம் (பாதுகாப்பான நேரம்)',
    deadlinePlus1h: '+1 மணி',
    deadlinePlus2h: '+2 மணி',
    deadlinePlus3h: '+3 மணி',
    deadlinePick: 'நேரம்',
    safeLimitNotice: 'பாதுகாப்பு வரம்பு: {type} வகைக்கு அதிகபட்சம் {hours} மணி நேரம்',
    capDeadlineBtn: 'பாதுகாப்பான நேரமாக மாற்று ({time})',
    // Location section
    locationSectionTitle: '4. பிக்கப் இருப்பிடம்',
    locationExplanation: 'தன்னார்வ அமைப்பு உங்கள் கடையை எளிதாகக் கண்டுபிடிக்க மட்டுமே உங்கள் இருப்பிடம் பயன்படுத்தப்படுகிறது.',
    shareLocationBtn: 'என் இருப்பிடத்தைப் பகிர்',
    sharingLocation: 'இருப்பிடம் பெறப்படுகிறது...',
    locationCaptured: 'இருப்பிடம் பெறப்பட்டது (±{acc} மீ)',
    locationDenied: 'இருப்பிட அனுமதி மறுக்கப்பட்டது அல்லது கிடைக்கவில்லை.',
    tryAgainBtn: 'மீண்டும் முயற்சி செய்',
    fallbackOr: 'அல்லது அடையாள இடம் / வரைபடத்தில் குறிக்கவும்:',
    landmarkLabel: 'அடையாள இடம் அல்லது முகவரி',
    landmarkPlaceholder: 'எ.கா. டவுன் ஹால் எதிரில், மேல வெளி வீதி',
    dropPinLabel: 'வரைபடத்தில் தொட்டு குறிக்கவும்',
    pinPlaced: 'வரைபடத்தில் குறிக்கப்பட்டது',
    // Submit & Validation
    submitBtn: '{count} உணவுகளை நன்கொடையாக வழங்கு',
    submitting: 'பதிவிடப்படுகிறது...',
    errShopNameRequired: 'தயவுசெய்து உங்கள் கடை அல்லது உணவகப் பெயரை உள்ளிடவும்.',
    errPhoneInvalid: 'தயவுசெய்து சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.',
    errLocationRequired: 'இருப்பிடத்தைப் பகிரவும், அடையாள இடத்தை உள்ளிடவும் அல்லது வரைபடத்தில் குறிக்கவும்.',
    errRateLimit: 'அளவை எட்டிவிட்டது: கடந்த ஒரு மணி நேரத்தில் 5 நன்கொடைகள் பதிவிடப்பட்டுள்ளன. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
    errSpamDetected: 'ஸ்பேம் பாதுகாப்பு சோதனை தோல்வியடைந்தது.',
    // Confirmation screen
    confirmTitle: 'நன்கொடை பதிவிடப்பட்டது!',
    confirmReviewNotice:
      'தன்னார்வ அமைப்பு இதை மதிப்பாய்வு செய்து வாகனத்தை உறுதி செய்யும். அவர்கள் உறுதிப்படுத்தும் வரை உணவு எடுத்துக்கொள்ளப்பட்டதாகக் கருதப்படாது.',
    confirmShop: 'கடை',
    confirmQty: 'அளவு',
    confirmFoodType: 'உணவு வகை',
    confirmPrepared: 'தயாரித்த நேரம்',
    confirmDeadline: 'கடைசி நேரம்',
    postAnotherBtn: 'மற்றொரு நன்கொடை பதிவிடு',
    ngoLabel: 'பெறும் தன்னார்வ அமைப்பு',
  },
};
