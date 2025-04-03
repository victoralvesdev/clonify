import { NextRequest, NextResponse } from 'next/server';

const SESSION_TOKEN = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..Tckie5ywj8KIjlIb._7KaIXNYY9RkFUbxXCnIWqObgkFoSxMKnwpbqciNN5z8DmWP-iH5vPwHQo90u6RCLW5bvyFfa9IoCHfFElEo9W2ImtRjjwRCJNhqIHXvtehLVnLz1KvEzBDBr7MTY3GG7JMzgg9SHHXadlrCxuE7ov-YYiP70MfQN7SmvZMgaFUWTvMuIBwELBgC324B0TxM7fkIEwJRfQwjyD5WiXFgSA-sKwz1Te-St4l59iNqr6liMo_1lC-nbgyrU0nc4Gst6L0Z2BkRNqAB6A.dVXDrjKJiPJpMd_H4jvMgQ';

export async function POST(request: NextRequest) {
  try {
    const { 
      keyword, 
      country = 'BR',
      platform = 'facebook',
      mediaType = 'all',
      startDate,
      endDate,
      userId 
    } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: 'Palavra-chave não fornecida' },
        { status: 400 }
      );
    }

    console.log('Buscando anúncios com parâmetros:', {
      keyword,
      country,
      platform,
      mediaType,
      startDate,
      endDate,
      userId
    });

    // Fazer requisição para a API do copie.ai
    const response = await fetch('https://painel.copie.ai/api/spy/get/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__Secure-next-auth.session-token=${SESSION_TOKEN}`
      },
      body: JSON.stringify({
        userId,
        country,
        platform,
        keyword,
        mediaType,
        startDate,
        endDate
      })
    });

    if (!response.ok) {
      console.error('Erro na API:', response.status, await response.text());
      return NextResponse.json(
        { error: `Erro na API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar anúncios' },
      { status: 500 }
    );
  }
} 