export const socialLinks = {
  instagram: {
    username: "@yazzinico",
    url: "https://www.instagram.com/yazzinico/",
  },
  whatsapp: {
    countryCode: "+91",
    phoneNumber: "7510669551",
    internationalNumber: "917510669551",
    url: "https://wa.me/917510669551",
    defaultMessage: "Hello VELMONT, I would like to know more about my luxury watches.",
  },
} as const;

export function whatsappHref(message: string = socialLinks.whatsapp.defaultMessage) {
  return `${socialLinks.whatsapp.url}?text=${encodeURIComponent(message)}`;
}

export const whatsappProductMessage = (productName: string) =>
  `Hello VELMONT, I am interested in the ${productName} watch. Please share more details.`;
