import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Calculator, Plus, RefreshCcw, Search, Settings } from 'lucide-react';

export default function PosSalesPage() {
  const cart = [
    {
      code: 'CR0129',
      name: 'Amodiaquinne (X1)',
      price: 40,
      qty: 5,
      total: 200,
    },
    {
      code: 'OL0239',
      name: 'Faith Calamine Lotion',
      price: 120,
      qty: 6,
      total: 720,
    },
  ];

  return (
    <Box bg="#b7dce9" h="100vh">
      {/* Top Header */}
      <Paper radius={0} withBorder p="xs" bg="#d9edf5">
        <Group justify="space-between">
          <Group>
            <Button size="xs">Next Sales</Button>

            <TextInput
              leftSection={<Search size={16} />}
              placeholder="Enter Item to search for Here"
              w={400}
            />
          </Group>

          <Text fw={600}>Selling to Customer: 1 | SALE CODE = 58C12026</Text>
        </Group>
      </Paper>

      {/* Toolbar */}
      <Paper radius={0} withBorder p="sm" bg="#bfe0ea">
        <Group>
          <Button color="yellow" variant="filled">
            Single Item Selection
          </Button>

          <Button variant="filled">Multiple Item Selection</Button>

          <Select
            label="Choose Customer"
            w={250}
            data={['ADOF HOSPITAL']}
            defaultValue="ADOF HOSPITAL"
          />

          <Button leftSection={<Plus size={16} />}>+ Customer</Button>

          <Text fw={700} size="lg">
            Customer: 1
          </Text>

          <Button color="red" leftSection={<RefreshCcw size={16} />}>
            Reset POS
          </Button>

          <ActionIcon size="lg" variant="light">
            <Settings size={18} />
          </ActionIcon>
        </Group>
      </Paper>

      {/* Item Entry */}
      <Paper radius={0} withBorder>
        <Table striped withTableBorder withColumnBorders horizontalSpacing="xs" verticalSpacing={4}>
          <Table.Thead bg="#a6d5e5">
            <Table.Tr>
              <Table.Th>No</Table.Th>
              <Table.Th>ITEM CODE</Table.Th>
              <Table.Th>ITEM NAME</Table.Th>
              <Table.Th>RtPrice</Table.Th>
              <Table.Th>WSPrice</Table.Th>
              <Table.Th>QUANTITY</Table.Th>
              <Table.Th>TOTAL</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            <Table.Tr>
              <Table.Td>
                <Checkbox defaultChecked />
              </Table.Td>

              <Table.Td>CR0129</Table.Td>

              <Table.Td>
                <Select data={['Amodiaquinne (X1)']} defaultValue="Amodiaquinne (X1)" />
              </Table.Td>

              <Table.Td>40</Table.Td>
              <Table.Td>20</Table.Td>

              <Table.Td>
                <NumberInput defaultValue={5} />
              </Table.Td>

              <Table.Td fw={700}>720</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Text ta="center" c="blue" py="xs" fw={600}>
          Add to Cart
        </Text>
      </Paper>

      {/* Main Layout */}
      <Grid gap={0}>
        {/* Cart Table */}
        <Grid.Col span={{ base: 12, md: 'auto' }}>
          <Paper radius={0} bg="#2f8a53" h="calc(100vh - 250px)">
            <ScrollArea h="100%">
              <Table withTableBorder withColumnBorders stickyHeader>
                <Table.Thead bg="#f0d56a">
                  <Table.Tr>
                    <Table.Th>S/N</Table.Th>
                    <Table.Th>CODE</Table.Th>
                    <Table.Th>ITEM NAME</Table.Th>
                    <Table.Th>PRICE</Table.Th>
                    <Table.Th>QTY</Table.Th>
                    <Table.Th>TotalCost</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {cart.map((item, index) => (
                    <Table.Tr key={item.code} bg="#00185f">
                      <Table.Td c="lime">{index + 1}</Table.Td>

                      <Table.Td c="lime">{item.code}</Table.Td>

                      <Table.Td c="lime">{item.name}</Table.Td>

                      <Table.Td c="lime">{item.price}</Table.Td>

                      <Table.Td c="lime">{item.qty}</Table.Td>

                      <Table.Td c="lime">{item.total}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Grid.Col>

        {/* Summary Panel */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper radius={0} withBorder bg="#c7e6f1" h="calc(100vh - 250px)">
            <Title order={3} ta="center" py="md">
              Current Sales Summary
            </Title>

            <Paper withBorder p="xs" radius={0}>
              <Flex justify="space-between">
                <Text size="sm">Items on Cart</Text>
                <Text fw={700}>2</Text>
              </Flex>
            </Paper>

            <Paper withBorder p="xs" radius={0}>
              <Flex justify="space-between">
                <Text size="sm">Total Cost</Text>
                <Text fw={700}>₦920.00</Text>
              </Flex>
            </Paper>

            <Paper withBorder p="xs" radius={0}>
              <Flex justify="space-between">
                <Text size="sm">Total Paid</Text>
                <Text fw={700}>Not Yet Paid</Text>
              </Flex>
            </Paper>

            <Button fullWidth mt="md" leftSection={<Calculator size={16} />}>
              Calculate Current Sales
            </Button>

            <Paper mt="md" p="md" withBorder>
              <Text ta="center" fw={700}>
                Total Cost
              </Text>

              <Title order={2} ta="center">
                ₦920.00
              </Title>
            </Paper>

            <Button fullWidth mt="md">
              Sell Only
            </Button>

            <Button fullWidth mt="xs">
              Sell Print
            </Button>

            <Button fullWidth mt="xs">
              Print Wholesale Receipt
            </Button>

            <Button fullWidth mt="xs">
              Next Customer
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
