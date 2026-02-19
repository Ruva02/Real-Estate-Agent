export interface Property {
    _id: string;
    title: string;
    location: string;
    price: number;
    bhk: number;
    description: string;
    image?: string;
    action: 'Buy' | 'Rent' | 'Sell';
}

export interface Message {
    id: string;
    type: 'user' | 'agent';
    text: string;
    timestamp: Date;
    properties?: Property[];
}
