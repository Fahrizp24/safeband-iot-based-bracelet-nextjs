import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Ambil parameter deviceId dari URL (jika ada)
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');

    // URL WebHDFS untuk membaca file logs.csv
    // Membaca file logs.csv dari Gateway Flask (port 5000)
    const url = 'http://34.21.197.249:5000/logs';

    // Memanggil API tanpa caching, sehingga selalu mengambil data HDFS yang terbaru
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Gagal fetch dari Hadoop WebHDFS: ${response.statusText} (${response.status})`);
    }

    const csvText = await response.text();
    
    // Memilah file berdasarkan baris baru
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    // Asumsi format kolom CSV yang ditulis gateway sesuai dengan payload ESP32:
    // Kolom: timestamp, deviceSn, type, accelerometerForce, status, latitude, longitude
    const incidents = lines.map((line, index) => {
      const cols = line.split(',');
      return {
        id: `hadoop-${index}`, // ID unik untuk React key
        timestamp: cols[0]?.trim() || '',
        deviceSn: cols[1]?.trim() || '',
        type: cols[2]?.trim() || '',
        accelerometerForce: cols[3]?.trim() || '',
        status: cols[4]?.trim() || '',
        lat: cols[5]?.trim() || '',
        lng: cols[6]?.trim() || ''
      };
    });

    // Jika parameter deviceId dikirim, filter array berdasarkan deviceSn
    let filteredIncidents = incidents;
    if (deviceId) {
      filteredIncidents = incidents.filter(inc => inc.deviceSn === deviceId);
    }

    // Urutkan data berdasarkan timestamp (terbaru di atas)
    filteredIncidents.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return (timeB || 0) - (timeA || 0);
    });

    return NextResponse.json({ success: true, data: filteredIncidents });
  } catch (error: any) {
    console.error('Error fetching Hadoop:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
