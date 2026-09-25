import { StyleSheet, View, Text } from 'react-native';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://172.24.198.235:8080');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const receivedLead = JSON.parse(event.data);

      setLeads((currentLeads) => [
        receivedLead,
        ...currentLeads,
      ]);
    };

    ws.onerror = (error) => {
      console.log('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UNQUE LEADS</Text>

      {leads.map((lead, index) => (
        <View style={styles.leadCard} key={index}>
          <Text>Name: {lead.name}</Text>
          <Text>Email: {lead.email}</Text>
          <Text>Phone: {lead.phone}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  leadCard: {
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
});