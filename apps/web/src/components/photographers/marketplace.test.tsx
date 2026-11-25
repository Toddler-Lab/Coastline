import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PhotographerMarketplace } from './marketplace';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(cleanup);

function createRequest() {
  fireEvent.click(screen.getByRole('button', { name: 'Post a shoot request' }));
  fireEvent.change(screen.getByLabelText('Shoot date'), { target: { value: '2027-12-20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create request preview' }));
}

function bookPackage() {
  fireEvent.click(screen.getByRole('button', { name: 'View Rafi’s profile' }));
  fireEvent.change(screen.getByLabelText('Shoot date'), { target: { value: '2027-12-20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review deposit' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm demo deposit' }));
}

describe('Photographers UI preview', () => {
  it('combines discovery filters and recovers from an empty result', () => {
    render(<PhotographerMarketplace />);
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Sylhet' } });
    expect(screen.getByRole('heading', { name: 'Arif Chowdhury' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Rafi Hasan' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Family' }));
    expect(screen.getByText('No matches this time')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('4 demo photographers')).toBeTruthy();
  });

  it('previews a deposit, charges only extras above the package and unlocks review after settlement', () => {
    render(<PhotographerMarketplace />);
    bookPackage();
    expect(screen.getAllByText('Confirmed', { selector: 'span' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Save demo review' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Preview completed shoot' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select photo 21' }));
    const selection = screen.getByRole('heading', { name: 'Your selection' }).parentElement!;
    expect(within(selection).getByText('Tk 105')).toBeTruthy();
    expect(within(selection).getByText('Tk 85')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Settle demo balance & unlock' }));
    expect(screen.getByText('Demo files unlocked')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deselect photo 1' }).hasAttribute('disabled')).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save demo review' }));
    expect(screen.getByText('Thanks — demo review saved.')).toBeTruthy();
  });

  it('shows a refund when per-photo keepers cost less than the deposit', () => {
    render(<PhotographerMarketplace />);
    fireEvent.click(screen.getByRole('button', { name: 'View Rafi’s profile' }));
    fireEvent.click(screen.getByRole('radio', { name: /Just your favourites/ }));
    fireEvent.change(screen.getByLabelText('Shoot date'), { target: { value: '2027-12-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review deposit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm demo deposit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Preview completed shoot' }));
    for (let i = 2; i <= 20; i++) {
      fireEvent.click(screen.getByRole('button', { name: `Deselect photo ${i}` }));
    }
    const selection = screen.getByRole('heading', { name: 'Your selection' }).parentElement!;
    expect(within(selection).getByText('Demo refund')).toBeTruthy();
    expect(within(selection).getByText('Tk 15')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Preview refund & unlock' }));
    expect(screen.getByText('Demo files unlocked')).toBeTruthy();
  });

  it('allows one counter per sample bid and closes competing bids after the deposit', () => {
    render(<PhotographerMarketplace />);
    createRequest();
    fireEvent.click(screen.getAllByRole('button', { name: 'Make one counter-offer' })[0]);
    fireEvent.change(screen.getByLabelText('Your proposed total (Tk)'), {
      target: { value: '90' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview counter-offer' }));
    expect(
      screen
        .getByRole('button', { name: 'Counter sent · awaiting reply' })
        .hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: 'Accept & review deposit' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm demo deposit' }));
    fireEvent.click(screen.getByRole('button', { name: 'My requests' }));
    expect(screen.getByText('Accepted · other bids closed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Accept & review deposit' })).toBeNull();
  });

  it('keeps an unrelated request open when a package is booked directly', () => {
    render(<PhotographerMarketplace />);
    createRequest();
    fireEvent.click(screen.getByRole('button', { name: 'Discover photographers' }));
    bookPackage();
    fireEvent.click(screen.getByRole('button', { name: 'My requests' }));
    expect(screen.getByText('Open for bids')).toBeTruthy();
  });
});
