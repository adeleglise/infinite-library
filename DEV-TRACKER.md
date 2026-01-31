# Infinite Library — Development Tracker

## ✅ Phase 1 — Fondations (Complété)
- [x] Structure Next.js 16 + Zustand
- [x] Système de ressources (glyphs)
- [x] 7 générateurs (Plume → Tour de Babel)
- [x] Sérialisation Decimal (break_infinity.js)
- [x] Bibliothèque pixel art animée
- [x] Notes API avec persistance S3
- [x] Thème parchemin clair
- [x] Déploiement Coolify

## ✅ Phase 2 — Upgrades (Complété)
- [x] Système d'upgrades permanent
- [x] Upgrades de click power (Calligraphie, Encre Enchantée, Main du Maître)
- [x] Upgrades de production par générateur (Plumes, Scribes, etc.)
- [x] Upgrades globaux (Sagesse Ancienne, Bibliothèque d'Alexandrie, Connaissance Universelle)
- [x] Upgrades de synergie (+% par générateur possédé)
- [x] Upgrades prestige (coûtent des vocables)
- [x] UI panel upgrades avec animations Framer Motion
- [x] Déblocage progressif des upgrades

## 📋 Phase 3 — Prestige & Progression
- [ ] Améliorer système prestige (vocables)
- [ ] Bonus de vocables sur production
- [ ] Deuxième couche prestige (fragments → codex)
- [ ] Prestige milestones (bonus permanents)

## 📋 Phase 4 — Contenu & Polish
- [ ] Achievements / Succès
- [ ] Statistiques détaillées
- [ ] Notifications de milestones
- [ ] Animations de déblocage
- [ ] Sons optionnels

## 📋 Phase 5 — Endgame
- [ ] Générateurs tier 2 (post-Babel)
- [ ] Méta-progression
- [ ] Secrets / Easter eggs Borges

---

## Notes de développement

### 2026-01-31 — Phase 2 Complétée ✅

**Système d'upgrades implémenté:**

Structure finale:
```typescript
interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: Decimal;
  currency: 'glyphs' | 'vocables' | 'fragments';
  category: 'click' | 'generator' | 'global' | 'synergy' | 'prestige';
  icon: string;
  multiplier: MultiplierType;
  unlockAt: UnlockCondition;
}
```

**20+ upgrades ajoutés:**
- 3 upgrades de clic (x2, x3, x5)
- 7 upgrades de générateurs (boost x2, x3 par type)
- 3 upgrades globaux (x1.5, x2, x3 sur toute production)
- 2 upgrades de synergie (+1% par générateur, +5% par type)
- 3 upgrades prestige (achetables avec vocables, permanents)

**Fichiers modifiés:**
- `src/data/upgrades.ts` — Définitions des upgrades
- `src/lib/types.ts` — Types pour upgrades et multiplicateurs
- `src/lib/gameStore.ts` — Logique des multiplicateurs
- `src/components/game/UpgradesPanel.tsx` — UI
- `src/components/game/Game.tsx` — Layout 3 colonnes

**Prochaine étape:** Phase 3 — Prestige & Progression
