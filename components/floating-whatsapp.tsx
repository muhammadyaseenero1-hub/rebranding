import { MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/social";

export function FloatingWhatsApp() {
  return (
    <a
      className="floating-whatsapp"
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with VELMONT on WhatsApp"
      title="Chat with VELMONT on WhatsApp"
    >
      <MessageCircle aria-hidden="true" size={24} strokeWidth={1.8} />
      <span className="floating-whatsapp-label">Chat with us</span>
    </a>
  );
}
