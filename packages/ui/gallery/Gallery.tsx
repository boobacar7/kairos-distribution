import { money } from '@kairos/types/money';
import { useState } from 'react';

import {
  Accordion,
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardTitle,
  Carousel,
  Checkbox,
  Dialog,
  EmptyState,
  Footer,
  NavItem,
  Pagination,
  PriceDisplay,
  ProductCard,
  QuantityStepper,
  Radio,
  RadioGroup,
  SelectField,
  Sheet,
  SideNav,
  Skeleton,
  SkipLink,
  Table,
  Tabs,
  TBody,
  TD,
  TextAreaField,
  TextField,
  TH,
  THead,
  Toast,
  ToastRegion,
  TopNav,
  TR,
} from '../src/index.js';

export function Gallery() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState('home');
  const [faq, setFaq] = useState<string | null>('one');
  const [page, setPage] = useState(1);
  const [qty, setQty] = useState(1);

  return (
    <div className="min-h-dvh bg-ivory text-ink">
      <SkipLink href="#main">[TEST] Aller au contenu</SkipLink>
      <TopNav
        label="[TEST] Navigation boutique"
        brand="[TEST] Kairos UI"
        actions={
          <Button size="sm" variant="secondary">
            [TEST] Panier
          </Button>
        }
      >
        <NavItem href="#hero" current>
          [TEST] Accueil
        </NavItem>
        <NavItem href="#forms">[TEST] Formulaires</NavItem>
        <NavItem href="#admin">[TEST] Admin</NavItem>
      </TopNav>

      <div className="lg:flex">
        <div className="hidden lg:block">
          <SideNav label="[TEST] Navigation admin" brand="[TEST] Admin">
            <NavItem href="#admin" current inverse>
              [TEST] Commandes
            </NavItem>
            <NavItem href="#table" inverse>
              [TEST] Produits
            </NavItem>
          </SideNav>
        </div>

        <main
          id="main"
          className="mx-auto w-full max-w-6xl space-y-section px-gutter py-8 md:px-gutter-md"
        >
          <header className="space-y-2">
            <p className="text-caption font-semibold tracking-wide text-botanical uppercase">
              [TEST] packages/ui gallery
            </p>
            <h1 className="font-serif text-display text-aubergine">[TEST] Système de design</h1>
            <p className="text-lead max-w-2xl text-botanical">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder copy only — not
              Kairos merchandising.
            </p>
          </header>

          <section id="hero" className="space-y-4">
            <h2 className="font-serif text-h2 text-aubergine">[TEST] Hero carousel</h2>
            <Carousel
              label="[TEST] Carrousel"
              previousLabel="[TEST] Précédent"
              nextLabel="[TEST] Suivant"
              pauseLabel="[TEST] Pause"
              playLabel="[TEST] Lecture"
              slideLabel={(pageNumber, total) => `[TEST] Diapositive ${pageNumber} sur ${total}`}
              slides={[
                {
                  id: 'one',
                  title: '[TEST] Titre un',
                  subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                  cta: { label: '[TEST] Action', href: '#forms' },
                  image: <div className="bg-botanical h-full w-full" />,
                  textPosition: 'left',
                },
                {
                  id: 'two',
                  title: '[TEST] Titre deux',
                  subtitle: 'Sed do eiusmod tempor incididunt ut labore.',
                  cta: { label: '[TEST] Action', href: '#forms' },
                  image: <div className="bg-aubergine h-full w-full" />,
                  textPosition: 'center',
                },
              ]}
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-h2 text-aubergine">[TEST] Boutons et états</h2>
            <div className="flex flex-wrap gap-3">
              <Button>[TEST] Primaire</Button>
              <Button variant="secondary">[TEST] Secondaire</Button>
              <Button variant="ghost">[TEST] Ghost</Button>
              <Button variant="destructive">[TEST] Destructeur</Button>
              <Button loading loadingLabel="[TEST] Chargement">
                [TEST] Chargement
              </Button>
              <Button disabled>[TEST] Désactivé</Button>
            </div>
            <Alert tone="success" title="[TEST] Succès">
              Lorem ipsum dolor sit amet.
            </Alert>
            <Alert tone="danger" title="[TEST] Erreur">
              Lorem ipsum dolor sit amet.
            </Alert>
            <Skeleton className="h-6 w-48" label="[TEST] Chargement" />
          </section>

          <section id="forms" className="space-y-4">
            <h2 className="font-serif text-h2 text-aubergine">[TEST] Formulaires</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="[TEST] Nom" hint="Lorem ipsum" required />
              <TextField label="[TEST] Email" error="[TEST] Requis" />
              <SelectField label="[TEST] Choix">
                <option value="">[TEST] Sélectionner</option>
                <option value="a">[TEST] Alpha</option>
              </SelectField>
              <TextAreaField label="[TEST] Message" />
            </div>
            <Checkbox label="[TEST] J’accepte" />
            <RadioGroup legend="[TEST] Méthode">
              <Radio name="method" label="[TEST] Un" defaultChecked />
              <Radio name="method" label="[TEST] Deux" />
            </RadioGroup>
            <QuantityStepper
              value={qty}
              onChange={setQty}
              decreaseLabel="[TEST] Diminuer"
              increaseLabel="[TEST] Augmenter"
              inputLabel="[TEST] Quantité"
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-h2 text-aubergine">[TEST] Cartes et commerce</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProductCard
                href="#product"
                name="[TEST] Productum"
                imageAlt="[TEST] Surface placeholder"
                price={money(12_500)}
                compareAt={money(15_000)}
                badge={<Badge tone="blush">[TEST]</Badge>}
                rating={4}
                ratingLabel="[TEST] 4 sur 5"
                stock="low"
                stockLabel="[TEST] Stock faible"
                actionLabel="[TEST] Ajouter"
                onAction={() => undefined}
              />
              <Card>
                <CardBody>
                  <CardTitle>[TEST] Carte</CardTitle>
                  <p className="text-body">Lorem ipsum dolor sit amet.</p>
                  <PriceDisplay amount={money(8_000)} />
                </CardBody>
              </Card>
            </div>
            <EmptyState
              title="[TEST] Vide"
              action={<Button variant="secondary">[TEST] Action</Button>}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </EmptyState>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-h2 text-aubergine">[TEST] Overlay</h2>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setDialogOpen(true)}>[TEST] Modal</Button>
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                [TEST] Tiroir
              </Button>
            </div>
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              title="[TEST] Modal"
              closeLabel="[TEST] Fermer"
              footer={
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  [TEST] OK
                </Button>
              }
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Dialog>
            <Sheet
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              title="[TEST] Tiroir"
              closeLabel="[TEST] Fermer"
              side="right"
            >
              Lorem ipsum dolor sit amet.
            </Sheet>
            <ToastRegion label="[TEST] Notifications">
              <Toast tone="info">[TEST] Notification lorem ipsum.</Toast>
            </ToastRegion>
          </section>

          <section id="table" className="space-y-4">
            <h2 className="font-serif text-h2 text-aubergine">[TEST] Table et navigation</h2>
            <Breadcrumb
              label="[TEST] Fil d’Ariane"
              items={[{ href: '#hero', label: '[TEST] Accueil' }, { label: '[TEST] Ici' }]}
            />
            <Tabs
              label="[TEST] Onglets"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'home', label: '[TEST] Un', panel: 'Lorem ipsum dolor sit amet.' },
                { id: 'next', label: '[TEST] Deux', panel: 'Consectetur adipiscing elit.' },
              ]}
            />
            <Accordion
              openId={faq}
              onChange={setFaq}
              items={[
                { id: 'one', title: '[TEST] Question une', content: 'Lorem ipsum dolor sit amet.' },
                { id: 'two', title: '[TEST] Question deux', content: 'Sed do eiusmod tempor.' },
              ]}
            />
            <Table caption="[TEST] Commandes">
              <THead>
                <TR>
                  <TH>Réf.</TH>
                  <TH>Statut</TH>
                  <TH>Total</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TD>KD-2026-000001</TD>
                  <TD>
                    <Badge tone="warning">[TEST] Pending</Badge>
                  </TD>
                  <TD>
                    <PriceDisplay amount={money(12_500)} />
                  </TD>
                </TR>
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageCount={4}
              onPageChange={setPage}
              previousLabel="[TEST] Précédent"
              nextLabel="[TEST] Suivant"
              pageLabel={(item) => `[TEST] Page ${item}`}
            />
          </section>
        </main>
      </div>

      <Footer label="[TEST] Pied de page">
        <p className="text-body-sm">[TEST] Pied de page — lorem ipsum dolor sit amet.</p>
      </Footer>
    </div>
  );
}
