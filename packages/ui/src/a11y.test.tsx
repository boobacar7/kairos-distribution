import { money } from '@kairos/types/money';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  Accordion,
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Checkbox,
  EmptyState,
  Pagination,
  ProductCard,
  Radio,
  RadioGroup,
  SelectField,
  SideNav,
  SkipLink,
  Table,
  Tabs,
  TBody,
  TD,
  TextField,
  TH,
  THead,
  TopNav,
  TR,
  NavItem,
} from './index.js';

function GalleryFixture() {
  const [tab, setTab] = useState('one');
  const [open, setOpen] = useState<string | null>('a');
  const [page, setPage] = useState(1);

  return (
    <div>
      <SkipLink href="#main">[TEST] Skip to content</SkipLink>
      <TopNav
        label="[TEST] Storefront"
        brand="[TEST] Brand"
        actions={<Button size="sm">[TEST] Cart</Button>}
      >
        <NavItem href="#boutique" current>
          [TEST] Shop
        </NavItem>
        <NavItem href="#faq">[TEST] FAQ</NavItem>
      </TopNav>
      <div className="flex">
        <SideNav label="[TEST] Admin" brand="[TEST] Admin">
          <NavItem href="#orders" current inverse>
            [TEST] Orders
          </NavItem>
          <NavItem href="#products" inverse>
            [TEST] Products
          </NavItem>
        </SideNav>
        <main id="main">
          <h1>[TEST] Gallery</h1>
          <h2>[TEST] Feedback</h2>
          <Alert tone="info" title="[TEST] Notice">
            Lorem ipsum dolor sit amet.
          </Alert>
          <h2>[TEST] Forms</h2>
          <TextField label="[TEST] Name" hint="Lorem ipsum" />
          <SelectField label="[TEST] Choice">
            <option value="a">[TEST] Alpha</option>
            <option value="b">[TEST] Beta</option>
          </SelectField>
          <Checkbox label="[TEST] Accept" />
          <RadioGroup legend="[TEST] Method">
            <Radio name="method" label="[TEST] One" defaultChecked />
            <Radio name="method" label="[TEST] Two" />
          </RadioGroup>
          <Badge tone="success">[TEST] Active</Badge>
          <h2>[TEST] Disclosure</h2>
          <Tabs
            label="[TEST] Sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'one', label: '[TEST] One', panel: 'Lorem ipsum.' },
              { id: 'two', label: '[TEST] Two', panel: 'Dolor sit amet.' },
            ]}
          />
          <Accordion
            openId={open}
            onChange={setOpen}
            items={[{ id: 'a', title: '[TEST] Question', content: 'Lorem ipsum dolor sit amet.' }]}
          />
          <h2>[TEST] Data</h2>
          <Table caption="[TEST] Orders">
            <THead>
              <TR>
                <TH>Ref</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>KD-2026-000001</TD>
                <TD>[TEST] Pending</TD>
              </TR>
            </TBody>
          </Table>
          <Pagination
            page={page}
            pageCount={3}
            onPageChange={setPage}
            previousLabel="[TEST] Previous"
            nextLabel="[TEST] Next"
            pageLabel={(item) => `[TEST] Page ${item}`}
          />
          <Breadcrumb
            label="[TEST] Breadcrumb"
            items={[{ href: '/', label: '[TEST] Home' }, { label: '[TEST] Here' }]}
          />
          <h2>[TEST] Commerce</h2>
          <ProductCard
            href="#product"
            name="[TEST] Productum"
            imageAlt="[TEST] Placeholder surface"
            price={money(12_500)}
            actionLabel="[TEST] Add"
            onAction={() => undefined}
          />
          <EmptyState title="[TEST] Empty">Lorem ipsum dolor sit amet.</EmptyState>
        </main>
      </div>
    </div>
  );
}

describe('design system a11y', () => {
  it('has no axe violations on a representative composition (contrast is unit-tested on tokens)', async () => {
    const { container } = render(<GalleryFixture />);
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
